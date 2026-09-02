"""日志配置与敏感信息脱敏。"""
import logging
import re
from logging.config import dictConfig

# 手机号、邮箱、JWT、密码等常见敏感模式
_SENSITIVE_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b1[3-9]\d{9}\b"), "1**********"),
    (re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"), "***@***.***"),
    (re.compile(r"(?i)(password|passwd|pwd|token|secret|authorization)\s*[:=]\s*\S+"), r"\1=***"),
    (re.compile(r"\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b"), "eyJ***"),
    (re.compile(r"(?i)Bearer\s+\S+"), "Bearer ***"),
]


def desensitize(text: str) -> str:
    result = text
    for pattern, replacement in _SENSITIVE_PATTERNS:
        result = pattern.sub(replacement, result)
    return result


class DesensitizeFilter(logging.Filter):
    """在日志输出前脱敏敏感字段。"""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.msg, str):
            record.msg = desensitize(record.msg)
        if record.args:
            record.args = tuple(
                desensitize(arg) if isinstance(arg, str) else arg for arg in record.args
            )
        return True


def setup_logging(debug: bool = False) -> None:
    level = "DEBUG" if debug else "INFO"
    dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "filters": {
                "desensitize": {"()": DesensitizeFilter},
            },
            "formatters": {
                "default": {
                    "format": "%(asctime)s %(levelname)s [%(name)s] %(message)s",
                    "datefmt": "%Y-%m-%d %H:%M:%S",
                },
            },
            "handlers": {
                "console": {
                    "class": "logging.StreamHandler",
                    "formatter": "default",
                    "filters": ["desensitize"],
                    "stream": "ext://sys.stdout",
                },
            },
            "root": {"level": level, "handlers": ["console"]},
            "loggers": {
                "uvicorn": {"level": level, "handlers": ["console"], "propagate": False},
                "uvicorn.error": {"level": level, "handlers": ["console"], "propagate": False},
                "uvicorn.access": {"level": level, "handlers": ["console"], "propagate": False},
            },
        }
    )
