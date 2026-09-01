"""Sprint 1 API tests."""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sprint1.db")

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
def user_credentials():
    suffix = uuid.uuid4().hex[:8]
    return {
        "username": f"testuser_{suffix}",
        "email": f"test_{suffix}@example.com",
        "password": "123456",
    }


def register_user(client: TestClient, creds: dict, **extra):
    payload = {
        "username": creds["username"],
        "email": creds["email"],
        "password": creds["password"],
        "confirmPassword": creds["password"],
        "gender": 1,
        **extra,
    }
    return client.post("/api/user/add", json=payload)


def test_health(client: TestClient):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register(client: TestClient, user_credentials):
    resp = register_user(client, user_credentials)
    body = resp.json()
    assert resp.status_code == 200
    assert body["code"] == "200"
    assert body["data"]["username"] == user_credentials["username"]


def test_register_duplicate_username(client: TestClient, user_credentials):
    register_user(client, user_credentials)
    resp = register_user(
        client,
        {**user_credentials, "email": f"dup_{user_credentials['email']}"},
    )
    body = resp.json()
    assert resp.status_code == 400
    assert body["code"] == "400"


def test_register_password_mismatch(client: TestClient, user_credentials):
    resp = client.post(
        "/api/user/add",
        json={
            "username": user_credentials["username"],
            "email": user_credentials["email"],
            "password": user_credentials["password"],
            "confirmPassword": "wrong",
            "gender": 1,
        },
    )
    body = resp.json()
    assert resp.status_code == 422
    assert body["code"] == "422"
    assert body["success"] is False


def test_register_ignores_admin_user_type(client: TestClient):
    suffix = uuid.uuid4().hex[:8]
    resp = client.post(
        "/api/user/add",
        json={
            "username": f"hacker_{suffix}",
            "email": f"hacker_{suffix}@example.com",
            "password": "123456",
            "confirmPassword": "123456",
            "gender": 1,
            "userType": 2,
        },
    )
    body = resp.json()
    assert resp.status_code == 200
    assert body["data"]["userType"] == 1

    login_resp = client.post(
        "/api/user/login",
        json={"username": f"hacker_{suffix}", "password": "123456"},
    )
    assert login_resp.json()["data"]["roleType"] == "1"


def test_login_with_username(client: TestClient, user_credentials):
    register_user(client, user_credentials)
    resp = client.post(
        "/api/user/login",
        json={"username": user_credentials["username"], "password": user_credentials["password"]},
    )
    body = resp.json()
    assert resp.status_code == 200
    assert body["code"] == "200"
    assert body["data"]["token"]


def test_login_with_email(client: TestClient, user_credentials):
    register_user(client, user_credentials)
    resp = client.post(
        "/api/user/login",
        json={"username": user_credentials["email"], "password": user_credentials["password"]},
    )
    assert resp.json()["code"] == "200"


def test_login_wrong_password(client: TestClient, user_credentials):
    register_user(client, user_credentials)
    resp = client.post(
        "/api/user/login",
        json={"username": user_credentials["username"], "password": "wrong"},
    )
    body = resp.json()
    assert resp.status_code == 400
    assert body["code"] == "400"


def test_logout_without_token(client: TestClient):
    resp = client.post("/api/user/logout")
    body = resp.json()
    assert resp.status_code == 401
    assert body["code"] == "401"


def test_logout_with_token(client: TestClient, user_credentials):
    register_user(client, user_credentials)
    login_resp = client.post(
        "/api/user/login",
        json={"username": user_credentials["username"], "password": user_credentials["password"]},
    )
    token = login_resp.json()["data"]["token"]
    resp = client.post("/api/user/logout", headers={"token": token})
    body = resp.json()
    assert resp.status_code == 200
    assert body["code"] == "200"


def test_login_response_user_info_fields(client: TestClient, user_credentials):
    register_user(client, user_credentials)
    resp = client.post(
        "/api/user/login",
        json={"username": user_credentials["username"], "password": user_credentials["password"]},
    )
    body = resp.json()
    data = body["data"]
    user_info = data["userInfo"]
    required = ["id", "username", "email", "nickname", "userType", "gender", "status", "createdAt"]
    assert body["success"] is True
    assert "roleType" in data
    assert all(field in user_info for field in required)
