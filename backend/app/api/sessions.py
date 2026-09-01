from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.schemas.session import StartSessionRequest, StreamChatRequest
from app.services.session_service import SessionService, parse_session_id
from app.services.chat_service import stream_chat as chat_stream_generator
from app.services.emotion_service import analyze_session_emotion

router = APIRouter(prefix="/psychological-chat", tags=["psychological-chat"])


def _parse_session_id_or_error(session_id: str):
    try:
        return parse_session_id(session_id), None
    except ValueError:
        return None, error_response("400", "无效的会话 ID", status_code=400)


def _parse_page(value: str | None, default: int) -> int:
    try:
        parsed = int(value) if value else default
        return max(parsed, 1)
    except (TypeError, ValueError):
        return default


@router.get("/sessions")
def list_sessions(
    pageNum: str | None = Query("1"),
    pageSize: str | None = Query("20"),
    currentPage: str | None = Query(None),
    size: str | None = Query(None),
    emotionTag: str | None = Query(""),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    page = _parse_page(currentPage or pageNum, 1)
    page_size = _parse_page(size or pageSize, 20)
    data = service.list_sessions(
        current_user,
        page_num=page,
        page_size=page_size,
        emotion_tag=emotionTag or "",
    )
    return success_response(data=data.model_dump(), msg="查询成功")


@router.post("/session/start")
def start_session(
    payload: StartSessionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    data = service.start_session(
        current_user,
        session_title=payload.sessionTitle or "新会话",
        initial_message=payload.initialMessage or "",
    )
    return success_response(data=data.model_dump(), msg="会话创建成功")


@router.get("/sessions/{session_id}/messages")
def get_session_messages(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    sid, err = _parse_session_id_or_error(session_id)
    if err:
        return err
    try:
        messages = service.get_messages(sid, current_user)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(data=[item.model_dump() for item in messages], msg="查询成功")


@router.delete("/sessions/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    sid, err = _parse_session_id_or_error(session_id)
    if err:
        return err
    try:
        service.delete_session(sid, current_user)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(data=None, msg="删除成功")


@router.post("/stream")
async def stream_chat(
    payload: StreamChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    sid, err = _parse_session_id_or_error(payload.sessionId)
    if err:
        return err

    if not service.session_exists_for_user(sid, current_user):
        return error_response("404", "会话不存在或无权访问", status_code=404)

    generator = chat_stream_generator(db, current_user, sid, payload.userMessage)
    return StreamingResponse(
        generator,
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/session/{session_id}/emotion")
async def get_session_emotion(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = SessionService(db)
    sid, err = _parse_session_id_or_error(session_id)
    if err:
        return err
    try:
        content = service.get_session_user_content(sid, current_user)
        data = await analyze_session_emotion(content)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(data=data.model_dump(), msg="查询成功")
