"""管理端 CSV 导出 API 测试。"""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_export.db")
os.environ.setdefault("LLM_PROVIDER", "mock")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.role import Role  # noqa: E402


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
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def user_headers(client: TestClient):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"export_user_{suffix}",
        "email": f"export_{suffix}@example.com",
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
    return {"token": login_resp.json()["data"]["token"]}


@pytest.fixture
def admin_headers(client: TestClient):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"export_admin_{suffix}",
        "email": f"export_admin_{suffix}@example.com",
        "password": "123456",
        "confirmPassword": "123456",
        "gender": 1,
        "agreeTerms": True,
    }
    client.post("/api/user/add", json=payload)
    from sqlalchemy import text

    with engine.begin() as conn:
        conn.execute(
            text(
                "UPDATE users SET role_id = (SELECT id FROM roles WHERE code = 2 LIMIT 1) "
                "WHERE username = :username"
            ),
            {"username": payload["username"]},
        )
    login_resp = client.post(
        "/api/user/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    return {"token": login_resp.json()["data"]["token"]}


def test_export_sessions_requires_admin(client: TestClient, user_headers: dict):
    resp = client.get("/api/admin/sessions/export", headers=user_headers)
    assert resp.status_code == 403


def test_export_diaries_requires_admin(client: TestClient, user_headers: dict):
    resp = client.get("/api/emotion-diary/admin/export", headers=user_headers)
    assert resp.status_code == 403


def test_export_sessions_csv(client: TestClient, admin_headers: dict, user_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=user_headers,
        json={"sessionTitle": "导出测试会话"},
    )
    assert create_resp.status_code == 200

    resp = client.get("/api/admin/sessions/export", headers=admin_headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    body = resp.content.decode("utf-8-sig")
    assert "会话ID" in body
    assert "导出测试会话" in body


def test_export_diaries_csv(client: TestClient, admin_headers: dict, user_headers: dict):
    client.post(
        "/api/emotion-diary",
        headers=user_headers,
        json={
            "diaryContent": "E2E 导出测试日记内容",
            "diaryDate": "2026-09-02",
            "dominantEmotion": "anxious",
            "emotionTriggers": "测试触发",
            "moodScore": 4,
            "sleepQuality": 3,
            "stressLevel": 4,
        },
    )

    resp = client.get("/api/emotion-diary/admin/export", headers=admin_headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    body = resp.content.decode("utf-8-sig")
    assert "日记ID" in body
    assert "E2E 导出测试日记内容" in body
