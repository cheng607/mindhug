"""基于 IP 的接口限流中间件（Redis 滑动窗口，不可用时回退内存）。"""
import logging
import time
from collections import defaultdict, deque
from threading import Lock

import redis
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response

from app.core.config import settings

logger = logging.getLogger(__name__)

STRICT_PATHS = (
    "/api/user/login",
    "/api/user/add",
    "/api/psychological-chat/stream",
)


class InMemoryRateLimiter:
    """进程内滑动窗口限流器（单 worker 或 Redis 不可用时的回退）。"""

    def __init__(self) -> None:
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def is_allowed(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.monotonic()
        cutoff = now - window_seconds
        with self._lock:
            bucket = self._buckets[key]
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if len(bucket) >= limit:
                return False
            bucket.append(now)
            return True


class RedisRateLimiter:
    """Redis 滑动窗口限流器（多 worker / 多实例共享计数）。"""

    def __init__(self, redis_url: str) -> None:
        self._client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )

    def is_allowed(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.time()
        redis_key = f"ratelimit:{key}"
        window_start = now - window_seconds
        pipe = self._client.pipeline()
        pipe.zremrangebyscore(redis_key, 0, window_start)
        pipe.zcard(redis_key)
        _, count = pipe.execute()
        if count >= limit:
            return False
        pipe = self._client.pipeline()
        pipe.zadd(redis_key, {str(now): now})
        pipe.expire(redis_key, window_seconds)
        pipe.execute()
        return True


_memory_limiter = InMemoryRateLimiter()
_redis_limiter: RedisRateLimiter | None = None
_redis_disabled: bool = False


def reset_rate_limiter_state() -> None:
    """重置限流器状态（测试用）。"""
    global _redis_limiter, _redis_disabled
    _redis_limiter = None
    _redis_disabled = False
    _memory_limiter._buckets.clear()


def _get_limiter() -> InMemoryRateLimiter | RedisRateLimiter:
    global _redis_limiter, _redis_disabled
    if not settings.RATE_LIMIT_USE_REDIS or _redis_disabled:
        return _memory_limiter
    if _redis_limiter is not None:
        return _redis_limiter
    try:
        limiter = RedisRateLimiter(settings.REDIS_URL)
        limiter._client.ping()
        _redis_limiter = limiter
        logger.info("接口限流使用 Redis 滑动窗口")
        return _redis_limiter
    except Exception as exc:
        _redis_disabled = True
        logger.warning("Redis 限流不可用，回退内存限流: %s", exc)
        return _memory_limiter


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _path_limit(path: str) -> tuple[int, int]:
    if any(path.startswith(p) for p in STRICT_PATHS):
        return settings.RATE_LIMIT_STRICT, settings.RATE_LIMIT_WINDOW_SECONDS
    return settings.RATE_LIMIT_DEFAULT, settings.RATE_LIMIT_WINDOW_SECONDS


class RateLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        if not settings.RATE_LIMIT_ENABLED:
            return await call_next(request)

        if request.url.path in ("/health", "/docs", "/openapi.json", "/redoc"):
            return await call_next(request)

        ip = _client_ip(request)
        limit, window = _path_limit(request.url.path)
        key = f"{ip}:{request.url.path}"

        if not _get_limiter().is_allowed(key, limit, window):
            return JSONResponse(
                status_code=429,
                content={
                    "code": "429",
                    "data": None,
                    "msg": "请求过于频繁，请稍后再试",
                    "success": False,
                },
            )

        return await call_next(request)
