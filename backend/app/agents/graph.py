"""轻量多 Agent 编排图（自研状态机实现）。"""
import asyncio
import json
import logging
import os
import time
from collections.abc import AsyncGenerator

from sqlalchemy.orm import Session

from app.agents.knowledge import (
    build_knowledge_messages,
    retrieve_knowledge,
)
from app.agents.mock_reply import build_mock_reply, should_supplement_rag
from app.agents.router import classify_intent
from app.agents.types import AGENT_NAMES, IntentType
from app.core.crisis import CRISIS_KEYWORDS
from app.models.agent_execution_log import AgentExecutionLog
from app.models.chat_session import SENDER_USER
from app.models.message import Message
from app.services.llm_service import llm_service
from app.services.prompt_config_service import PromptConfigService
from app.services.risk_alert_service import RiskAlertService

logger = logging.getLogger(__name__)


def _build_conversation_context(history: list[Message]) -> str:
    """提取前几轮用户发言，注入 system prompt 以强化上下文连贯性。"""
    user_msgs = [m.content.strip() for m in history if m.sender_type == SENDER_USER and m.content]
    if len(user_msgs) <= 1:
        return ""
    prior = user_msgs[:-1][-4:]
    bullets = "\n".join(f"- {line}" for line in prior)
    return (
        f"\n\n## 对话背景（用户前几轮说过）\n{bullets}\n\n"
        "请自然承接上文，回应本轮新内容；不要重复追问已聊过的问题，"
        "不要用引号复述用户原话，不要套「我听到…」等模板句。"
    )


def build_agent_messages(
    db: Session,
    history: list[Message],
    intent: IntentType,
    max_messages: int | None = None,
    rag_context: str = "",
) -> list[dict[str, str]]:
    from app.core.config import settings

    limit = max_messages or settings.LLM_MAX_CONTEXT_MESSAGES
    recent = history[-limit:] if len(history) > limit else history
    prompt_service = PromptConfigService(db)
    system_prompt = prompt_service.get_prompt(intent)
    system_prompt += _build_conversation_context(recent)

    if rag_context and intent in ("counsel", "listen"):
        system_prompt = (
            f"{system_prompt}\n\n"
            "以下是从知识库检索到的参考资料，可在回答中适当引用并标注来源：\n"
            f"{rag_context}"
        )

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for msg in recent:
        role = "user" if msg.sender_type == SENDER_USER else "assistant"
        messages.append({"role": role, "content": msg.content})
    return messages


def log_agent_execution(
    db: Session,
    session_id: int,
    user_id: int,
    user_message: str,
    intent: IntentType,
    latency_ms: int,
    llm_used: bool,
) -> None:
    log = AgentExecutionLog(
        session_id=session_id,
        user_id=user_id,
        user_message=user_message[:500],
        intent=intent,
        active_agent=AGENT_NAMES[intent],
        latency_ms=latency_ms,
        llm_used=llm_used,
    )
    db.add(log)
    db.commit()


def maybe_create_risk_alert(
    db: Session,
    session_id: int,
    user_id: int,
    user_message: str,
    intent: IntentType,
) -> None:
    if intent == "crisis":
        RiskAlertService(db).create_alert(
            user_id=user_id,
            session_id=session_id,
            risk_level=3,
            trigger_reason="危机信号检测",
            user_message=user_message,
        )
        return
    if any(kw in user_message for kw in CRISIS_KEYWORDS):
        RiskAlertService(db).create_alert(
            user_id=user_id,
            session_id=session_id,
            risk_level=3,
            trigger_reason="危机关键词匹配",
            user_message=user_message,
        )


async def _stream_text_as_sse(text: str, chunk_size: int = 4, delay: float = 0.03) -> AsyncGenerator[str, None]:
    for index in range(0, len(text), chunk_size):
        chunk = text[index : index + chunk_size]
        payload = json.dumps({"content": chunk}, ensure_ascii=False)
        yield f"data: {payload}\n\n"
        await asyncio.sleep(delay)


class AgentGraph:
    """多 Agent 编排状态机：Router → Agent → SSE 流式输出。"""

    async def stream(
        self,
        db: Session,
        session_id: int,
        user_id: int,
        history: list[Message],
        user_message: str,
    ) -> AsyncGenerator[str, None]:
        start = time.perf_counter()
        intent = classify_intent(user_message, history)
        agent_name = AGENT_NAMES[intent]

        maybe_create_risk_alert(db, session_id, user_id, user_message, intent)

        meta = json.dumps({"agent": intent, "agentName": agent_name}, ensure_ascii=False)
        yield f"data: {meta}\n\n"

        citations = []
        rag_context = ""
        need_rag = intent == "knowledge" or should_supplement_rag(intent, user_message)
        if need_rag:
            citations, rag_context = await retrieve_knowledge(
                db,
                user_message,
                allow_whitelist_web=(intent == "knowledge"),
            )
            if citations:
                cite_payload = json.dumps(
                    {"citations": [item.to_dict() for item in citations]},
                    ensure_ascii=False,
                )
                yield f"data: {cite_payload}\n\n"

        accumulated = ""
        llm_used = False
        llm_params = PromptConfigService(db).get_llm_params(intent)

        # 危机场景始终使用固定模板（含统一热线），不调用 LLM
        if intent == "crisis":
            reply = build_mock_reply(user_message, intent, citations, history)
            accumulated = reply
            async for event in _stream_text_as_sse(reply):
                yield event
        elif llm_service.enabled:
            try:
                if intent == "knowledge":
                    messages = build_knowledge_messages(db, history, user_message, rag_context)
                else:
                    messages = build_agent_messages(
                        db, history, intent, rag_context=rag_context if citations else ""
                    )
                async for chunk in llm_service.chat_stream(
                    messages,
                    model=llm_params["model"],
                    temperature=llm_params["temperature"],
                    max_tokens=llm_params["max_tokens"],
                ):
                    accumulated += chunk
                    llm_used = True
                    payload = json.dumps({"content": chunk}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
            except Exception as exc:
                logger.error("Agent %s LLM 失败，回退 mock: %s", intent, exc)
                reply = build_mock_reply(user_message, intent, citations, history)
                accumulated = reply
                async for event in _stream_text_as_sse(reply):
                    yield event
        else:
            reply = build_mock_reply(user_message, intent, citations, history)
            accumulated = reply
            async for event in _stream_text_as_sse(reply):
                yield event

        latency_ms = int((time.perf_counter() - start) * 1000)
        try:
            log_agent_execution(db, session_id, user_id, user_message, intent, latency_ms, llm_used)
        except Exception as exc:
            logger.warning("Agent 日志写入失败: %s", exc)
            db.rollback()


agent_graph = AgentGraph()
