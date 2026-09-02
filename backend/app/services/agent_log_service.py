import math
from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.models.agent_execution_log import AgentExecutionLog
from app.schemas.agent_log import AgentLogItemResponse, AgentLogPageResponse


def _to_iso(dt: datetime | None) -> str:
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def build_agent_log_item(log: AgentExecutionLog) -> AgentLogItemResponse:
    return AgentLogItemResponse(
        id=log.id,
        sessionId=log.session_id,
        userId=log.user_id,
        userNickname=log.user.display_name if log.user else "",
        userMessage=log.user_message,
        intent=log.intent,
        activeAgent=log.active_agent,
        latencyMs=log.latency_ms,
        llmUsed=log.llm_used,
        createdAt=_to_iso(log.created_at),
    )


class AgentLogService:
    def __init__(self, db: Session):
        self.db = db

    def list_logs(
        self,
        page_num: int = 1,
        page_size: int = 20,
        intent: str = "",
        user_id: str | None = None,
    ) -> AgentLogPageResponse:
        query = (
            self.db.query(AgentExecutionLog)
            .options(joinedload(AgentExecutionLog.user))
        )
        if intent:
            query = query.filter(AgentExecutionLog.intent == intent)
        if user_id:
            try:
                query = query.filter(AgentExecutionLog.user_id == int(user_id))
            except ValueError:
                pass

        total = query.count()
        pages = max(math.ceil(total / page_size), 1) if page_size else 1
        current = min(max(page_num, 1), pages) if total else 1
        offset = (current - 1) * page_size

        logs = (
            query.order_by(desc(AgentExecutionLog.created_at), desc(AgentExecutionLog.id))
            .offset(offset)
            .limit(page_size)
            .all()
        )

        records = [build_agent_log_item(item) for item in logs]
        return AgentLogPageResponse(
            records=records,
            total=total,
            size=page_size,
            current=current,
            pages=pages,
        )
