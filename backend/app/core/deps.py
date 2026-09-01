from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User


def get_current_user(
    token: str | None = Header(None, alias="token"),
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
