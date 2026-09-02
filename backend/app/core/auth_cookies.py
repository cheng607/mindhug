"""JWT httpOnly Cookie 辅助（Q-06）。"""
from fastapi import Response

from app.core.config import settings


def set_auth_cookie(response: Response, token: str) -> None:
    max_age = settings.JWT_EXPIRE_MINUTES * 60
    response.set_cookie(
        key=settings.AUTH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=not settings.DEBUG,
        samesite="lax",
        max_age=max_age,
        path="/",
    )


def clear_auth_cookie(response: Response) -> None:
    response.delete_cookie(
        key=settings.AUTH_COOKIE_NAME,
        path="/",
        httponly=True,
        samesite="lax",
    )
