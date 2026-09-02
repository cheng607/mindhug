"""LangGraph 风格多 Agent 编排图（轻量状态机实现）。"""
import asyncio
import json
import logging
import re
import time
from collections.abc import AsyncGenerator

from sqlalchemy.orm import Session

from app.agents.knowledge import (
    build_knowledge_messages,
    build_knowledge_mock_reply,
    retrieve_knowledge,
)
from app.agents.prompts import AGENT_PROMPTS
from app.agents.router import classify_intent
from app.agents.types import AGENT_NAMES, IntentType
from app.core.config import settings
from app.models.agent_execution_log import AgentExecutionLog
from app.models.chat_session import SENDER_AI, SENDER_USER
from app.models.message import Message
from app.core.crisis import CRISIS_KEYWORDS, CRISIS_RESPONSE_TEMPLATE
from app.services.llm_service import llm_service
from app.services.prompt_config_service import PromptConfigService
from app.services.risk_alert_service import RiskAlertService
from app.services.session_service import MOCK_AI_RESPONSE

logger = logging.getLogger(__name__)

LISTENER_MOCK = (
    "我能感受到你现在的不容易。愿意把这些感受说出来，本身就是很重要的一步。\n\n"
    "你可以先试着做几次深呼吸，把注意力慢慢带回当下。"
    "如果愿意，也可以告诉我：最近最让你困扰的具体事情是什么？"
)


def build_agent_messages(
    db: Session,
    history: list[Message],
    intent: IntentType,
    max_messages: int | None = None,
) -> list[dict[str, str]]:
    limit = max_messages or settings.LLM_MAX_CONTEXT_MESSAGES
    recent = history[-limit:] if len(history) > limit else history
    prompt_service = PromptConfigService(db)
    system_prompt = prompt_service.get_prompt(intent)

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for msg in recent:
        role = "user" if msg.sender_type == SENDER_USER else "assistant"
        messages.append({"role": role, "content": msg.content})
    return messages


def build_mock_reply(user_message: str, intent: IntentType, citations=None) -> str:
    if intent == "crisis" or any(kw in user_message for kw in CRISIS_KEYWORDS):
        return CRISIS_RESPONSE_TEMPLATE
    if intent == "knowledge":
        return build_knowledge_mock_reply(user_message, citations or [])
    if intent == "counsel":
        if re.search(r"(建议|怎么办|如何|帮助)", user_message):
            return (
                f"关于「{user_message[:20]}」，我想先确认一下："
                "这件事里，最让你感到压力的部分是什么？\n\n"
                + MOCK_AI_RESPONSE
            )
        return (
            "我理解你希望获得一些具体的建议。以下是几个可以尝试的小步骤：\n\n"
            "1. **深呼吸**：每天花 5 分钟做腹式呼吸\n"
            "2. **记录**：写下今天发生的三件小事\n"
            "3. **运动**：每天散步 15 分钟\n\n"
            "你觉得哪个最适合现在的你？"
        )
    return LISTENER_MOCK


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
        intent = classify_intent(user_message)
        agent_name = AGENT_NAMES[intent]

        maybe_create_risk_alert(db, session_id, user_id, user_message, intent)

        meta = json.dumps({"agent": intent, "agentName": agent_name}, ensure_ascii=False)
        yield f"data: {meta}\n\n"

        citations = []
        rag_context = ""
        if intent == "knowledge":
            citations, rag_context = await retrieve_knowledge(db, user_message)
            if citations:
                cite_payload = json.dumps(
                    {"citations": [item.to_dict() for item in citations]},
                    ensure_ascii=False,
                )
                yield f"data: {cite_payload}\n\n"

        accumulated = ""
        llm_used = False

        if llm_service.enabled:
            try:
                if intent == "knowledge":
                    messages = build_knowledge_messages(db, history, user_message, rag_context)
                else:
                    messages = build_agent_messages(db, history, intent)
                async for chunk in llm_service.chat_stream(messages):
                    accumulated += chunk
                    llm_used = True
                    payload = json.dumps({"content": chunk}, ensure_ascii=False)
                    yield f"data: {payload}\n\n"
            except Exception as exc:
                logger.error("Agent %s LLM 失败，回退 mock: %s", intent, exc)
                reply = build_mock_reply(user_message, intent, citations)
                accumulated = reply
                async for event in _stream_text_as_sse(reply):
                    yield event
        else:
            reply = build_mock_reply(user_message, intent, citations)
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
