from typing import Any

from fastapi.responses import JSONResponse


def success_response(data: Any = None, msg: str = "操作成功") -> dict[str, Any]:
    return {
        "code": "200",
        "data": data,
        "msg": msg,
        "success": True,
    }


def error_response(code: str, msg: str, status_code: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "code": code,
            "data": None,
            "msg": msg,
            "success": False,
        },
    )
