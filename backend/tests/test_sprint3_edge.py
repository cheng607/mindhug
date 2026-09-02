"""Sprint 3 edge-case tests (run manually)."""
import io
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sprint3_edge.db")
os.environ.setdefault("UPLOAD_DIR", "test_uploads")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User  # noqa: E402
from app.services.seed_service import seed_knowledge  # noqa: E402


@pytest.fixture(scope="module", autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for item in [
            {"name": "user", "code": 1, "description": "普通用户"},
            {"name": "admin", "code": 2, "description": "管理员"},
        ]:
            db.add(Role(**item))
        db.commit()
        seed_knowledge(db)
    finally:
        db.close()
    yield


@pytest.fixture
def client():
    return TestClient(app, raise_server_exceptions=False)


def _auth(client: TestClient, admin: bool = False) -> dict:
    suffix = uuid.uuid4().hex[:6]
    username = f"edge_{suffix}"
    client.post(
        "/api/user/add",
        json={
            "username": username,
            "email": f"{suffix}@example.com",
            "password": "123456",
            "confirmPassword": "123456",
            "gender": 1,
            "agreeTerms": True,
        },
    )
    if admin:
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            role = db.query(Role).filter(Role.code == 2).first()
            user.role_id = role.id
            db.commit()
        finally:
            db.close()
    token = client.post(
        "/api/user/login",
        json={"username": username, "password": "123456"},
    ).json()["data"]["token"]
    return {"token": token}


def test_draft_article_hidden_from_public(client: TestClient):
    admin = _auth(client, admin=True)
    category_id = client.get("/api/knowledge/category/tree").json()["data"][0]["id"]
    client.post(
        "/api/knowledge/article",
        headers=admin,
        json={
            "categoryId": category_id,
            "title": "未发布草稿",
            "summary": "s",
            "content": "<p>c</p>",
            "coverImage": "",
            "tags": ["test"],
        },
    )
    client.cookies.clear()
    public_records = client.get(
        "/api/knowledge/article/page",
        params={"currentPage": "1", "size": "50"},
    ).json()["data"]["records"]
    assert not any(item["title"] == "未发布草稿" for item in public_records)


def test_user_cannot_create_article(client: TestClient):
    user = _auth(client)
    category_id = client.get("/api/knowledge/category/tree").json()["data"][0]["id"]
    resp = client.post(
        "/api/knowledge/article",
        headers=user,
        json={
            "categoryId": category_id,
            "title": "Hack",
            "summary": "s",
            "content": "<p>c</p>",
            "coverImage": "",
            "tags": "x",
        },
    )
    assert resp.status_code == 403


def test_invalid_mood_score_rejected(client: TestClient):
    user = _auth(client)
    resp = client.post(
        "/api/emotion-diary",
        headers=user,
        json={
            "diaryContent": "test",
            "diaryDate": "2026-09-01",
            "dominantEmotion": "happy",
            "emotionTriggers": "",
            "moodScore": 99,
            "sleepQuality": 1,
            "stressLevel": 1,
        },
    )
    assert resp.status_code == 422


def test_non_image_upload_rejected(client: TestClient):
    user = _auth(client)
    resp = client.post(
        "/api/file/upload",
        headers=user,
        files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")},
        data={"businessType": "ARTICLE", "businessId": "1", "businessField": "cover"},
    )
    assert resp.status_code == 400


def test_unpublished_article_detail_returns_404_for_public(client: TestClient):
    admin = _auth(client, admin=True)
    category_id = client.get("/api/knowledge/category/tree").json()["data"][0]["id"]
    create = client.post(
        "/api/knowledge/article",
        headers=admin,
        json={
            "categoryId": category_id,
            "title": "草稿详情",
            "summary": "s",
            "content": "<p>c</p>",
            "coverImage": "",
            "tags": "x",
        },
    )
    article_id = create.json()["data"]["id"]
    client.cookies.clear()
    resp = client.get(f"/api/knowledge/article/{article_id}")
    assert resp.status_code == 404
