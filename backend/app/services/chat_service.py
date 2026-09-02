"""咨询对话服务：多 Agent 编排 + 上下文管理 + SSE 流式输出。"""
import json
import logging
from collections.abc import AsyncGenerator

from sqlalchemy.orm import Session

from app.agents.graph import agent_graph
from app.models.message import Message
from app.models.user import User
from app.services.session_service import SessionService

logger = logging.getLogger(__name__)


async def stream_chat(
    db: Session,
    user: User,
    session_id: int,
    user_message: str,
) -> AsyncGenerator[str, None]:
    service = SessionService(db)

    try:
        service.save_user_message(session_id, user, user_message)
    except ValueError as exc:
        payload = json.dumps({"error": str(exc)}, ensure_ascii=False)
        yield f"data: {payload}\n\n"
        yield "data: [DONE]\n\n"
        return

    history = (
        db.query(Message)
        .filter(Message.session_id == session_id)
        .order_by(Message.created_at.asc(), Message.id.asc())
        .all()
    )

    accumulated = ""
    citations: list[dict] | None = None
    async for event in agent_graph.stream(db, session_id, user.id, history, user_message):
        yield event
        if not event.startswith("data: "):
            continue
        payload_str = event[6:].strip()
        if payload_str == "[DONE]":
            continue
        try:
            payload = json.loads(payload_str)
            if "content" in payload:
                accumulated += payload["content"]
            if "citations" in payload and payload["citations"]:
                citations = payload["citations"]
        except json.JSONDecodeError:
            pass

    if accumulated.strip():
        service.save_ai_message(session_id, user, accumulated, citations=citations)

    yield "data: [DONE]\n\n"
