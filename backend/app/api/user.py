from fastapi import APIRouter, Depends, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.auth_cookies import clear_auth_cookie, set_auth_cookie
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.schemas.user import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    build_user_info,
)
from app.services.password_reset_service import PasswordResetService
from app.services.user_service import UserService

router = APIRouter(prefix="/user", tags=["user"])


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = UserService(db)
    user = service.authenticate(data.username, data.password)
    if not user:
        return error_response("400", "用户名或密码错误", status_code=400)

    token = service.create_token_for_user(user)
    response = JSONResponse(
        content=success_response(
            data={
                "userInfo": build_user_info(user).model_dump(),
                "token": token,
                "roleType": str(user.user_type),
            },
            msg="登录成功",
        )
    )
    set_auth_cookie(response, token)
    return response


@router.post("/add")
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    service = UserService(db)
    try:
        user = service.create_user(data)
    except ValueError as e:
        return error_response("400", str(e), status_code=400)

    return success_response(
        data=build_user_info(user).model_dump(),
        msg="注册成功",
    )


@router.post("/logout")
def logout(response: Response, _current_user: User = Depends(get_current_user)):
    clear_auth_cookie(response)
    return success_response(data="退出成功", msg="退出成功")


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return success_response(data=build_user_info(current_user).model_dump(), msg="查询成功")


@router.put("/profile")
def update_profile(
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    try:
        user = service.update_profile(current_user.id, data)
    except ValueError as e:
        return error_response("400", str(e), status_code=400)
    return success_response(data=build_user_info(user).model_dump(), msg="资料更新成功")


@router.put("/password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = UserService(db)
    try:
        service.change_password(current_user.id, data.oldPassword, data.newPassword)
    except ValueError as e:
        return error_response("400", str(e), status_code=400)
    return success_response(data=None, msg="密码修改成功")


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):
    PasswordResetService(db).request_reset(data.email)
    return success_response(
        data=None,
        msg="若该邮箱已注册，您将收到密码重置邮件（开发模式请查看后端日志）",
    )


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):
    service = PasswordResetService(db)
    try:
        service.reset_password(data.token, data.newPassword)
    except ValueError as e:
        return error_response("400", str(e), status_code=400)
    return success_response(data=None, msg="密码重置成功，请使用新密码登录")
