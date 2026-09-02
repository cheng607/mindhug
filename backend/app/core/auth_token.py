"""从 Cookie 或 Header 提取 JWT（Cookie 优先，兼容测试/E2E 的 token 头）。"""
from fastapi import Cookie, Header

from app.core.config import settings


def extract_access_token(
    cookie_token: str | None = Cookie(None, alias=settings.AUTH_COOKIE_NAME),
    header_token: str | None = Header(None, alias="token"),
) -> str | None:
    # Header 优先：便于测试/E2E 显式传 token；浏览器正常请求仅带 Cookie
    return header_token or cookie_token
