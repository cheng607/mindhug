"""忘记密码 / 重置密码（F-01）。"""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.models.password_reset_token import PasswordResetToken
from app.models.user import User
from app.services.email_service import email_service


class PasswordResetService:
    def __init__(self, db: Session):
        self.db = db

    def _hash_token(self, raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode()).hexdigest()

    def request_reset(self, email: str) -> None:
        user = self.db.query(User).filter(User.email == email.strip()).first()
        if not user or user.status != 1:
            return

        raw_token = secrets.token_urlsafe(32)
        token_hash = self._hash_token(raw_token)
        expires_at = datetime.now(timezone.utc) + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
        )

        self.db.query(PasswordResetToken).filter(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used.is_(False),
        ).update({"used": True})

        self.db.add(
            PasswordResetToken(
                user_id=user.id,
                token_hash=token_hash,
                expires_at=expires_at,
                used=False,
            )
        )
        self.db.commit()

        reset_url = f"{settings.FRONTEND_URL.rstrip('/')}/auth/reset?token={raw_token}"
        email_service.send_password_reset(user.email, reset_url)

    def reset_password(self, raw_token: str, new_password: str) -> None:
        token_hash = self._hash_token(raw_token.strip())
        now = datetime.now(timezone.utc)

        record = (
            self.db.query(PasswordResetToken)
            .filter(
                PasswordResetToken.token_hash == token_hash,
                PasswordResetToken.used.is_(False),
                PasswordResetToken.expires_at > now,
            )
            .first()
        )
        if not record:
            raise ValueError("重置链接无效或已过期")

        user = self.db.query(User).filter(User.id == record.user_id).first()
        if not user or user.status != 1:
            raise ValueError("用户不存在或已被禁用")

        user.password_hash = get_password_hash(new_password)
        record.used = True
        self.db.commit()
