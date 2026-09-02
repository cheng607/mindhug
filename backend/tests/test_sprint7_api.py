"""Sprint 7 RAG + admin enhancement tests."""
import asyncio
import json
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sprint7.db")
os.environ.setdefault("LLM_PROVIDER", "mock")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.article_chunk import ArticleChunk  # noqa: E402
from app.models.risk_alert import RiskAlert  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.rag_service import RAGService  # noqa: E402
from app.services.seed_service import seed_knowledge  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
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
        seed_knowledge(db)
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


def _register_and_login(client: TestClient, as_admin: bool = False) -> dict:
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"s7_user_{suffix}",
        "email": f"s7_{suffix}@example.com",
        "password": "123456",
        "confirmPassword": "123456",
        "gender": 1,
        "agreeTerms": True,
    }
    client.post("/api/user/add", json=payload)
    if as_admin:
        db = SessionLocal()
        try:
            admin_role = db.query(Role).filter(Role.code == 2).first()
            user = db.query(User).filter(User.username == payload["username"]).first()
            if user and admin_role:
                user.role_id = admin_role.id
                db.commit()
        finally:
            db.close()
    login_resp = client.post(
        "/api/user/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    token = login_resp.json()["data"]["token"]
    return {"token": token}


@pytest.fixture
def user_headers(client: TestClient):
    return _register_and_login(client, as_admin=False)


@pytest.fixture
def admin_headers(client: TestClient):
    return _register_and_login(client, as_admin=True)


@pytest.mark.asyncio
async def test_rag_index_and_search():
    db = SessionLocal()
    try:
        rag = RAGService(db)
        count = await rag.index_all_published()
        assert count > 0
        assert db.query(ArticleChunk).count() > 0
        results = await rag.search("焦虑症", top_k=2)
        assert len(results) > 0
        assert results[0].title
    finally:
        db.close()


def test_knowledge_stream_includes_citations(client: TestClient, user_headers: dict):
    db = SessionLocal()
    try:
        rag = RAGService(db)
        asyncio.run(rag.index_all_published())
    finally:
        db.close()

    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=user_headers,
        json={"sessionTitle": "RAG测试"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    citations = None
    with client.stream(
        "POST",
        "/api/psychological-chat/stream",
        headers={**user_headers, "Accept": "text/event-stream"},
        json={"sessionId": session_id, "userMessage": "什么是焦虑症"},
    ) as response:
        assert response.status_code == 200
        for line in response.iter_lines():
            if not line.startswith("data: "):
                continue
            payload = line[6:]
            if payload == "[DONE]":
                break
            data = json.loads(payload)
            if "citations" in data:
                citations = data["citations"]
                break

    assert citations is not None
    assert len(citations) >= 1
    assert "title" in citations[0]

    messages_resp = client.get(
        f"/api/psychological-chat/sessions/{session_id}/messages",
        headers=user_headers,
    )
    assert messages_resp.status_code == 200
    messages = messages_resp.json()["data"]
    ai_messages = [m for m in messages if m["senderType"] == 2]
    assert len(ai_messages) >= 1
    assert ai_messages[-1].get("citations")
    assert len(ai_messages[-1]["citations"]) >= 1


def test_crisis_creates_risk_alert(client: TestClient, user_headers: dict, admin_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=user_headers,
        json={"sessionTitle": "危机测试"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    with client.stream(
        "POST",
        "/api/psychological-chat/stream",
        headers={**user_headers, "Accept": "text/event-stream"},
        json={"sessionId": session_id, "userMessage": "我不想活了"},
    ) as response:
        assert response.status_code == 200
        for line in response.iter_lines():
            if line.startswith("data: ") and line[6:] == "[DONE]":
                break

    list_resp = client.get("/api/admin/risk-alerts", headers=admin_headers)
    assert list_resp.status_code == 200
    records = list_resp.json()["data"]["records"]
    assert len(records) >= 1
    assert records[0]["riskLevel"] == 3


def test_agent_config_crud(client: TestClient, admin_headers: dict):
    list_resp = client.get("/api/admin/agent-config", headers=admin_headers)
    assert list_resp.status_code == 200
    configs = list_resp.json()["data"]
    assert len(configs) >= 4

    knowledge = next(item for item in configs if item["agentKey"] == "knowledge")
    update_resp = client.put(
        f"/api/admin/agent-config/{knowledge['agentKey']}",
        headers=admin_headers,
        json={"systemPrompt": "测试知识 Agent Prompt"},
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["systemPrompt"] == "测试知识 Agent Prompt"


def test_rag_reindex_admin(client: TestClient, admin_headers: dict):
    resp = client.post("/api/admin/rag/reindex", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["data"]["chunkCount"] > 0


def test_risk_alert_requires_admin(client: TestClient, user_headers: dict):
    resp = client.get("/api/admin/risk-alerts", headers=user_headers)
    assert resp.status_code == 403


def test_emotion_analysis_creates_risk_alert(client: TestClient, user_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=user_headers,
        json={"sessionTitle": "情绪预警", "initialMessage": "最近压力很大失眠焦虑"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    emotion_resp = client.get(
        f"/api/psychological-chat/session/{session_id}/emotion",
        headers=user_headers,
    )
    assert emotion_resp.status_code == 200
    assert emotion_resp.json()["data"]["riskLevel"] >= 2

    db = SessionLocal()
    try:
        alerts = db.query(RiskAlert).filter(RiskAlert.trigger_reason == "情绪分析预警").all()
        assert len(alerts) >= 1
    finally:
        db.close()
