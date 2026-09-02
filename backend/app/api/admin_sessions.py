from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.services.session_service import SessionService

router = APIRouter(prefix="/admin/sessions", tags=["admin-sessions"])


def _parse_page(value: str | None, default: int) -> int:
    try:
        parsed = int(value) if value else default
        return max(parsed, 1)
    except (TypeError, ValueError):
        return default


@router.get("")
def list_admin_sessions(
    pageNum: str | None = Query("1"),
    pageSize: str | None = Query("10"),
    currentPage: str | None = Query(None),
    size: str | None = Query(None),
    emotionTag: str | None = Query(""),
    userId: str | None = Query(None),
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    page = _parse_page(currentPage or pageNum, 1)
    page_size = _parse_page(size or pageSize, 10)
    data = service.list_admin_sessions(
        page_num=page,
        page_size=page_size,
        emotion_tag=emotionTag or "",
        user_id=userId,
    )
    return success_response(data=data.model_dump(), msg="查询成功")


@router.get("/export")
def export_admin_sessions(
    emotionTag: str | None = Query(""),
    userId: str | None = Query(None),
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    content = service.export_admin_sessions_csv(
        emotion_tag=emotionTag or "",
        user_id=userId,
    )
    return Response(
        content=content,
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="consultations.csv"'},
    )


@router.get("/{session_id}/messages")
def get_admin_session_messages(
    session_id: str,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    from app.services.session_service import parse_session_id

    service = SessionService(db)
    try:
        sid = parse_session_id(session_id)
        messages = service.get_messages_admin(sid)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(data=[item.model_dump() for item in messages], msg="查询成功")
