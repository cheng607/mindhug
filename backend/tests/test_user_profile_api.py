"""用户资料与改密码 API 测试。"""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_user_profile.db")

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


def _register_and_login(client: TestClient) -> dict:
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"profile_{suffix}",
        "email": f"profile_{suffix}@example.com",
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
    data = login_resp.json()["data"]
    return {
        "token": data["token"],
        "username": payload["username"],
        "password": payload["password"],
    }


def test_get_me(client: TestClient):
    auth = _register_and_login(client)
    headers = {"token": auth["token"]}
    resp = client.get("/api/user/me", headers=headers)
    body = resp.json()
    assert resp.status_code == 200
    assert body["code"] == "200"
    assert body["data"]["username"] == auth["username"]


def test_update_profile(client: TestClient):
    auth = _register_and_login(client)
    headers = {"token": auth["token"]}
    resp = client.put(
        "/api/user/profile",
        headers=headers,
        json={"nickname": "小暖用户", "phone": "13800138000", "gender": 2},
    )
    body = resp.json()
    assert resp.status_code == 200
    assert body["data"]["nickname"] == "小暖用户"
    assert body["data"]["phone"] == "13800138000"
    assert body["data"]["gender"] == 2


def test_change_password(client: TestClient):
    auth = _register_and_login(client)
    headers = {"token": auth["token"]}
    new_password = "654321"
    resp = client.put(
        "/api/user/password",
        headers=headers,
        json={
            "oldPassword": auth["password"],
            "newPassword": new_password,
            "confirmPassword": new_password,
        },
    )
    assert resp.status_code == 200
    assert resp.json()["code"] == "200"

    old_login = client.post(
        "/api/user/login",
        json={"username": auth["username"], "password": auth["password"]},
    )
    assert old_login.json()["code"] != "200"

    new_login = client.post(
        "/api/user/login",
        json={"username": auth["username"], "password": new_password},
    )
    assert new_login.json()["code"] == "200"


def test_change_password_wrong_old(client: TestClient):
    auth = _register_and_login(client)
    headers = {"token": auth["token"]}
    resp = client.put(
        "/api/user/password",
        headers=headers,
        json={
            "oldPassword": "wrong-password",
            "newPassword": "654321",
            "confirmPassword": "654321",
        },
    )
    assert resp.status_code == 400
    assert resp.json()["code"] == "400"
