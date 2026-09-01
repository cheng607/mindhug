from fastapi import APIRouter, BackgroundTasks, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user, get_current_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.schemas.diary import DiaryCreateRequest
from app.services.diary_service import DiaryService, build_diary_item, run_diary_analysis_task

router = APIRouter(prefix="/emotion-diary", tags=["emotion-diary"])


def _parse_page(value: str | None, default: int) -> int:
    try:
        parsed = int(value) if value else default
        return max(parsed, 1)
    except (TypeError, ValueError):
        return default


def _parse_optional_int(value: str | None) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


@router.post("")
def create_diary(
    payload: DiaryCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = DiaryService(db)
    diary = service.create_diary(current_user, payload)
    background_tasks.add_task(run_diary_analysis_task, diary.id)
    return success_response(
        data=build_diary_item(diary, current_user).model_dump(),
        msg="提交成功",
    )


@router.get("/admin/page")
def list_admin_diaries(
    currentPage: str | None = Query("1"),
    size: str | None = Query("10"),
    userId: str | None = Query(None),
    dominantEmotion: str | None = Query(None),
    minMoodScore: str | None = Query(None),
    maxMoodScore: str | None = Query(None),
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = DiaryService(db)
    page = _parse_page(currentPage, 1)
    page_size = _parse_page(size, 10)
    data = service.list_admin_diaries(
        page_num=page,
        page_size=page_size,
        user_id=userId,
        dominant_emotion=dominantEmotion,
        min_mood_score=_parse_optional_int(minMoodScore),
        max_mood_score=_parse_optional_int(maxMoodScore),
    )
    return success_response(data=data.model_dump(), msg="查询成功")


@router.delete("/admin/{diary_id}")
def delete_diary(
    diary_id: int,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = DiaryService(db)
    try:
        service.delete_diary(diary_id)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(data=None, msg="删除成功")
