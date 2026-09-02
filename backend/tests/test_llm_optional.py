"""可选真实 LLM 集成测试（需配置 LLM_API_KEY 且 LLM_PROVIDER != mock）。"""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_llm_optional.db")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.role import Role  # noqa: E402

pytestmark = pytest.mark.llm


def _llm_configured() -> bool:
    provider = os.getenv("LLM_PROVIDER", "mock")
    api_key = os.getenv("LLM_API_KEY", "").strip()
    return provider != "mock" and bool(api_key)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for item in [
            {"name": "user", "code": 1, "description": "普通用户"},
            {"name": "admin", "code": 2, "description": "管理员"},
        ]:
            if not db.query(Role).filter(Role.code == item["code"]).first():
                db.add(Role(**item))
        db.commit()
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def auth_headers(client: TestClient):
    suffix = uuid.uuid4().hex[:8]
    resp = client.post(
        "/api/user/add",
        json={
            "username": f"llm_user_{suffix}",
            "email": f"llm_{suffix}@example.com",
            "password": "123456",
            "confirmPassword": "123456",
            "gender": 1,
            "agreeTerms": True,
        },
    )
    assert resp.status_code == 200
    login = client.post(
        "/api/user/login",
        json={"username": f"llm_user_{suffix}", "password": "123456"},
    )
    token = login.json()["data"]["token"]
    return {"token": token}


@pytest.mark.skipif(not _llm_configured(), reason="需要 LLM_PROVIDER != mock 且 LLM_API_KEY")
def test_real_llm_stream_smoke(client: TestClient, auth_headers: dict):
    """真实 LLM 流式对话 smoke test。"""
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "LLM Smoke Test"},
    )
    assert create_resp.status_code == 200
    session_id = create_resp.json()["data"]["sessionId"]

    content_parts: list[str] = []
    with client.stream(
        "POST",
        "/api/psychological-chat/stream",
        headers={**auth_headers, "Accept": "text/event-stream"},
        json={"sessionId": session_id, "userMessage": "你好，请简单介绍一下你自己"},
    ) as response:
        assert response.status_code == 200
        for line in response.iter_lines():
            if not line.startswith("data: "):
                continue
            payload = line[6:]
            if payload == "[DONE]":
                break
            import json
            data = json.loads(payload)
            if "content" in data:
                content_parts.append(data["content"])

    full = "".join(content_parts)
    assert len(full.strip()) > 10, "真实 LLM 应返回非空回复"


@pytest.mark.skipif(not _llm_configured(), reason="需要 LLM_PROVIDER != mock 且 LLM_API_KEY")
def test_real_embedding_rag_smoke():
    """真实 Embedding RAG 检索 smoke test。"""
    import asyncio

    from app.core.database import SessionLocal
    from app.services.rag_service import RAGService

    db = SessionLocal()
    try:
        rag = RAGService(db)
        results = asyncio.run(rag.search("心理健康", top_k=1))
    finally:
        db.close()
    assert results is not None
