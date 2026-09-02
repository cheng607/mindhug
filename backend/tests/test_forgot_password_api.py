"""忘记密码 / 重置密码 API 测试（F-01）。"""
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_forgot_password.db")
os.environ.setdefault("LLM_PROVIDER", "mock")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.password_reset_token import PasswordResetToken  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.password_reset_service import PasswordResetService  # noqa: E402


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
def registered_user(client: TestClient):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"fp_user_{suffix}",
        "email": f"fp_{suffix}@example.com",
        "password": "123456",
        "confirmPassword": "123456",
        "gender": 1,
        "agreeTerms": True,
    }
    client.post("/api/user/add", json=payload)
    return payload


def test_forgot_password_always_success(client: TestClient):
    resp = client.post("/api/user/forgot-password", json={"email": "unknown@example.com"})
    assert resp.status_code == 200
    assert resp.json()["code"] == "200"


def test_reset_password_flow(client: TestClient, registered_user: dict):
    forgot = client.post(
        "/api/user/forgot-password",
        json={"email": registered_user["email"]},
    )
    assert forgot.status_code == 200

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == registered_user["email"]).first()
        assert user is not None
        token_row = (
            db.query(PasswordResetToken)
            .filter(PasswordResetToken.user_id == user.id, PasswordResetToken.used.is_(False))
            .first()
        )
        assert token_row is not None

        service = PasswordResetService(db)
        raw_token = "test-reset-token-for-unit-test"
        token_row.token_hash = service._hash_token(raw_token)
        db.commit()
    finally:
        db.close()

    new_password = "654321"
    reset = client.post(
        "/api/user/reset-password",
        json={
            "token": raw_token,
            "newPassword": new_password,
            "confirmPassword": new_password,
        },
    )
    assert reset.status_code == 200

    login_old = client.post(
        "/api/user/login",
        json={"username": registered_user["username"], "password": registered_user["password"]},
    )
    assert login_old.json()["code"] != "200"

    login_new = client.post(
        "/api/user/login",
        json={"username": registered_user["username"], "password": new_password},
    )
    assert login_new.json()["code"] == "200"


def test_reset_password_invalid_token(client: TestClient):
    resp = client.post(
        "/api/user/reset-password",
        json={
            "token": "invalid-token-value",
            "newPassword": "654321",
            "confirmPassword": "654321",
        },
    )
    assert resp.status_code == 400
