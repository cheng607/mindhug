from fastapi import Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.auth_token import extract_access_token
from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


def get_current_user(
    token: str | None = Depends(extract_access_token),
    db: Session = Depends(get_db),
) -> User:
    if not token:
        raise HTTPException(
            status_code=401,
            detail={"code": "401", "msg": "未登录或登录已过期", "success": False},
        )

    user_id = decode_access_token(token)
    if not user_id:
        raise HTTPException(
            status_code=401,
            detail={"code": "401", "msg": "无效的登录凭证", "success": False},
        )

    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.status != 1:
        raise HTTPException(
            status_code=401,
            detail={"code": "401", "msg": "用户不存在或已被禁用", "success": False},
        )

    return user


def get_optional_user(
    token: str | None = Depends(extract_access_token),
    db: Session = Depends(get_db),
) -> User | None:
    if not token:
        return None
    user_id = decode_access_token(token)
    if not user_id:
        return None
    user = db.query(User).filter(User.id == int(user_id)).first()
    if not user or user.status != 1:
        return None
    return user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_type != 2:
        raise HTTPException(
            status_code=403,
            detail={"code": "403", "msg": "需要管理员权限", "success": False},
        )
    return current_user
