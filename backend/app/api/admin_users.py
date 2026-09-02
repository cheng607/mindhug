from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.schemas.user import UpdateUserRoleRequest, UpdateUserStatusRequest
from app.services.user_service import UserService

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


def _parse_page(value: str | None, default: int) -> int:
    try:
        parsed = int(value) if value else default
        return max(parsed, 1)
    except (TypeError, ValueError):
        return default


def _parse_optional_status(value: str | None) -> int | None:
    if value in (None, ""):
        return None
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


@router.get("")
def list_users(
    pageNum: str | None = Query("1"),
    pageSize: str | None = Query("20"),
    username: str | None = Query(""),
    status: str | None = Query(None),
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    data = service.list_users_admin(
        page_num=_parse_page(pageNum, 1),
        page_size=_parse_page(pageSize, 20),
        username=username or "",
        status=_parse_optional_status(status),
    )
    return success_response(data=data, msg="查询成功")


@router.put("/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: UpdateUserStatusRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    try:
        user = service.update_user_status(admin, user_id, payload.status)
    except ValueError as exc:
        return error_response("400", str(exc), status_code=400)
    return success_response(data=user.model_dump(), msg="状态更新成功")


@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    payload: UpdateUserRoleRequest,
    admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    try:
        user = service.update_user_role(admin, user_id, payload.roleCode)
    except ValueError as exc:
        return error_response("400", str(exc), status_code=400)
    return success_response(data=user.model_dump(), msg="角色更新成功")
