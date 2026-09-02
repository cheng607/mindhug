"""管理端用户管理 API 测试。"""
import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_admin_users.db")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User  # noqa: E402


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


def _register(client: TestClient, prefix: str) -> dict:
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"{prefix}_{suffix}",
        "email": f"{prefix}_{suffix}@example.com",
        "password": "123456",
        "confirmPassword": "123456",
        "gender": 1,
        "agreeTerms": True,
    }
    client.post("/api/user/add", json=payload)
    login = client.post(
        "/api/user/login",
        json={"username": payload["username"], "password": payload["password"]},
    )
    return {
        "username": payload["username"],
        "password": payload["password"],
        "token": login.json()["data"]["token"],
        "user_id": login.json()["data"]["userInfo"]["id"],
    }


def _promote_admin(username: str) -> None:
    db: Session = SessionLocal()
    try:
        admin_role = db.query(Role).filter(Role.code == 2).first()
        user = db.query(User).filter(User.username == username).first()
        assert admin_role and user
        user.role_id = admin_role.id
        db.commit()
    finally:
        db.close()


def test_admin_list_and_manage_users(client: TestClient):
    admin = _register(client, "admin")
    target = _register(client, "target")
    _promote_admin(admin["username"])

    headers = {"token": admin["token"]}
    list_resp = client.get("/api/admin/users", headers=headers)
    assert list_resp.status_code == 200
    records = list_resp.json()["data"]["records"]
    assert any(r["username"] == target["username"] for r in records)

    ban_resp = client.put(
        f"/api/admin/users/{target['user_id']}/status",
        headers=headers,
        json={"status": 0},
    )
    assert ban_resp.status_code == 200
    assert ban_resp.json()["data"]["status"] == 0

    banned_login = client.post(
        "/api/user/login",
        json={"username": target["username"], "password": target["password"]},
    )
    assert banned_login.json()["code"] != "200"

    unban_resp = client.put(
        f"/api/admin/users/{target['user_id']}/status",
        headers=headers,
        json={"status": 1},
    )
    assert unban_resp.status_code == 200

    role_resp = client.put(
        f"/api/admin/users/{target['user_id']}/role",
        headers=headers,
        json={"roleCode": 2},
    )
    assert role_resp.status_code == 200
    assert role_resp.json()["data"]["userType"] == 2


def test_admin_cannot_ban_self(client: TestClient):
    admin = _register(client, "selfadmin")
    _promote_admin(admin["username"])
    headers = {"token": admin["token"]}
    resp = client.put(
        f"/api/admin/users/{admin['user_id']}/status",
        headers=headers,
        json={"status": 0},
    )
    assert resp.status_code == 400
