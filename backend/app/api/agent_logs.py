from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.core.response import success_response
from app.models.user import User
from app.services.agent_log_service import AgentLogService

router = APIRouter(prefix="/admin/agent-logs", tags=["admin-agent-logs"])


def _parse_page(value: str | None, default: int) -> int:
    try:
        parsed = int(value) if value else default
        return max(parsed, 1)
    except (TypeError, ValueError):
        return default


@router.get("")
def list_agent_logs(
    pageNum: str | None = Query("1"),
    pageSize: str | None = Query("10"),
    intent: str | None = Query(""),
    userId: str | None = Query(None),
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = AgentLogService(db)
    data = service.list_logs(
        page_num=_parse_page(pageNum, 1),
        page_size=_parse_page(pageSize, 10),
        intent=intent or "",
        user_id=userId,
    )
    return success_response(data=data.model_dump(), msg="查询成功")
