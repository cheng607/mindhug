from contextlib import asynccontextmanager
from pathlib import Path
import logging

from fastapi import FastAPI, HTTPException, Request

from app.api.legal import router as legal_router
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.admin_sessions import router as admin_sessions_router
from app.api.agent_config import router as agent_config_router
from app.api.agent_logs import router as agent_logs_router
from app.api.analytics import router as analytics_router
from app.api.diary import router as diary_router
from app.api.files import router as files_router
from app.api.knowledge import router as knowledge_router
from app.api.rag import router as rag_router
from app.api.risk_alerts import router as risk_alerts_router
from app.api.sessions import router as sessions_router
from app.api.user import router as user_router
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.core.logging_config import setup_logging
from app.core.rate_limit import RateLimitMiddleware
from app.models.role import Role
from app.services.prompt_config_service import PromptConfigService
from app.services.rag_service import RAGService
from app.services.seed_service import seed_knowledge

setup_logging(debug=settings.DEBUG)
logger = logging.getLogger(__name__)


def seed_roles() -> None:
    db = SessionLocal()
    try:
        defaults = [
            {"name": "user", "code": 1, "description": "普通用户"},
            {"name": "admin", "code": 2, "description": "管理员"},
        ]
        for item in defaults:
            exists = db.query(Role).filter(Role.code == item["code"]).first()
            if not exists:
                db.add(Role(**item))
        db.commit()
        seed_knowledge(db)
        PromptConfigService(db).seed_defaults()
    finally:
        db.close()


async def seed_rag_index() -> None:
    db = SessionLocal()
    try:
        rag = RAGService(db)
        count = await rag.index_all_published()
        logger.info("RAG 启动索引完成，共 %s 个分块", count)
    except Exception as exc:
        logger.warning("RAG 启动索引失败: %s", exc)
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_roles()
    await seed_rag_index()
    yield


app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    errors = exc.errors()
    msg = errors[0].get("msg", "参数校验失败") if errors else "参数校验失败"
    return JSONResponse(
        status_code=422,
        content={"code": "422", "data": None, "msg": msg, "success": False},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(_request: Request, exc: HTTPException):
    detail = exc.detail
    if isinstance(detail, dict) and "code" in detail:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "code": detail.get("code", str(exc.status_code)),
                "data": None,
                "msg": detail.get("msg", "请求失败"),
                "success": False,
            },
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "code": str(exc.status_code),
            "data": None,
            "msg": str(detail),
            "success": False,
        },
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(RateLimitMiddleware)

upload_path = Path(settings.UPLOAD_DIR)
upload_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_path)), name="uploads")

app.include_router(user_router, prefix="/api")
app.include_router(sessions_router, prefix="/api")
app.include_router(diary_router, prefix="/api")
app.include_router(knowledge_router, prefix="/api")
app.include_router(files_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(risk_alerts_router, prefix="/api")
app.include_router(admin_sessions_router, prefix="/api")
app.include_router(agent_logs_router, prefix="/api")
app.include_router(agent_config_router, prefix="/api")
app.include_router(rag_router, prefix="/api")
app.include_router(legal_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}
