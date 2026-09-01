from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.schemas.user import LoginRequest, RegisterRequest, build_user_info
from app.services.user_service import UserService

router = APIRouter(prefix="/user", tags=["user"])


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    service = UserService(db)
    user = service.authenticate(data.username, data.password)
    if not user:
        return error_response("400", "用户名或密码错误", status_code=400)

    token = service.create_token_for_user(user)
    return success_response(
        data={
            "userInfo": build_user_info(user).model_dump(),
            "token": token,
            "roleType": str(user.user_type),
        },
        msg="登录成功",
    )


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
def logout(_current_user: User = Depends(get_current_user)):
    return success_response(data="退出成功", msg="退出成功")
