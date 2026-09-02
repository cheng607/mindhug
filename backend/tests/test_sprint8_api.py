"""Sprint 8 产品化：法律合规、限流、危机干预、日志脱敏测试。"""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sprint8.db")
os.environ.setdefault("LLM_PROVIDER", "mock")
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")

from app.core.logging_config import desensitize  # noqa: E402
from app.core.rate_limit import reset_rate_limiter_state  # noqa: E402
from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.role import Role  # noqa: E402
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


def _register_and_login(client: TestClient) -> dict:
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"s8_user_{suffix}",
        "email": f"s8_{suffix}@example.com",
        "password": "123456",
        "confirmPassword": "123456",
        "gender": 1,
        "agreeTerms": True,
    }
    client.post("/api/user/add", json=payload)
    login_resp = client.post(
        "/api/user/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    token = login_resp.json()["data"]["token"]
    return {"token": token, "username": payload["username"]}


class TestLegalApi:
    def test_crisis_resources(self, client: TestClient):
        resp = client.get("/api/legal/crisis-resources")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert body["data"]["hotline"] == "400-161-9995"
        assert len(body["data"]["resources"]) >= 1

    def test_disclaimer(self, client: TestClient):
        resp = client.get("/api/legal/disclaimer")
        assert resp.status_code == 200
        body = resp.json()
        assert body["success"] is True
        assert "AI" in body["data"]["content"]


class TestLogDesensitize:
    def test_mask_phone(self):
        assert "1**********" in desensitize("用户手机 13812345678 登录")

    def test_mask_email(self):
        result = desensitize("contact: user@example.com")
        assert "user@example.com" not in result

    def test_mask_token(self):
        result = desensitize("token=abc123secret")
        assert "abc123secret" not in result


class TestCrisisFlow:
    def test_crisis_message_routes_to_crisis_agent(self, client: TestClient):
        auth = _register_and_login(client)
        headers = {"token": auth["token"]}

        start_resp = client.post(
            "/api/psychological-chat/session/start",
            json={"initialMessage": "", "sessionTitle": "危机测试"},
            headers=headers,
        )
        session_id = start_resp.json()["data"]["sessionId"]

        stream_resp = client.post(
            "/api/psychological-chat/stream",
            json={"sessionId": str(session_id), "userMessage": "我不想活了"},
            headers=headers,
        )
        assert stream_resp.status_code == 200
        body = stream_resp.text
        assert '"agent": "crisis"' in body or '"agent":"crisis"' in body
        # 热线在 SSE 分块中可能被拆分
        assert "0-16" in body and "1-99" in body


class TestRateLimit:
    def test_rate_limit_returns_429(self, monkeypatch):
        from app.core import config
        import app.core.rate_limit as rate_limit_module

        reset_rate_limiter_state()
        monkeypatch.setattr(config.settings, "RATE_LIMIT_ENABLED", True)
        monkeypatch.setattr(config.settings, "RATE_LIMIT_USE_REDIS", False)
        monkeypatch.setattr(config.settings, "RATE_LIMIT_STRICT", 2)
        monkeypatch.setattr(config.settings, "RATE_LIMIT_WINDOW_SECONDS", 60)
        rate_limit_module._memory_limiter._buckets.clear()

        limited_client = TestClient(app, raise_server_exceptions=False)
        payload = {"username": "nonexistent", "password": "wrong"}

        for _ in range(2):
            limited_client.post("/api/user/login", json=payload)

        resp = limited_client.post("/api/user/login", json=payload)
        assert resp.status_code == 429
        body = resp.json()
        assert body["code"] == "429"
        assert body["success"] is False


class TestHealth:
    def test_health_check(self, client: TestClient):
        resp = client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
