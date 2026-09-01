"""Sprint 3 business module API tests."""
import io
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sprint3.db")
os.environ.setdefault("UPLOAD_DIR", "test_uploads")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.models.user import User  # noqa: E402
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
        "username": f"s3_user_{suffix}",
        "email": f"s3_{suffix}@example.com",
        "password": "123456",
        "confirmPassword": "123456",
        "gender": 1,
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


def test_create_diary_requires_auth(client: TestClient):
    resp = client.post(
        "/api/emotion-diary",
        json={
            "diaryContent": "今天心情不错",
            "diaryDate": "2026-09-01",
            "dominantEmotion": "happy",
            "emotionTriggers": "完成了任务",
            "moodScore": 8,
            "sleepQuality": 4,
            "stressLevel": 2,
        },
    )
    assert resp.status_code == 401


def test_create_and_list_diary(client: TestClient, user_headers: dict, admin_headers: dict):
    create_resp = client.post(
        "/api/emotion-diary",
        headers=user_headers,
        json={
            "diaryContent": "今天工作压力很大，有点焦虑",
            "diaryDate": "2026-09-01",
            "dominantEmotion": "anxious",
            "emotionTriggers": "项目 deadline",
            "moodScore": 4,
            "sleepQuality": 2,
            "stressLevel": 4,
        },
    )
    body = create_resp.json()
    assert create_resp.status_code == 200
    assert body["code"] == "200"
    assert body["data"]["dominantEmotion"] == "anxious"
    assert body["data"]["aiAnalysisStatus"] == "PENDING"

    list_resp = client.get(
        "/api/emotion-diary/admin/page",
        headers=admin_headers,
        params={"currentPage": "1", "size": "10"},
    )
    list_body = list_resp.json()
    assert list_resp.status_code == 200
    assert list_body["data"]["total"] >= 1
    assert len(list_body["data"]["records"]) >= 1
    record = list_body["data"]["records"][0]
    assert record["hasAiEmotionAnalysis"] is True
    assert record["aiAnalysisStatus"] == "COMPLETED"
    delete_resp = client.delete(
        f"/api/emotion-diary/admin/{record['id']}",
        headers=admin_headers,
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json()["code"] == "200"


def test_diary_admin_requires_admin(client: TestClient, user_headers: dict):
    resp = client.get("/api/emotion-diary/admin/page", headers=user_headers)
    assert resp.status_code == 403
    assert resp.json()["code"] == "403"


def test_knowledge_category_tree(client: TestClient):
    resp = client.get("/api/knowledge/category/tree")
    body = resp.json()
    assert resp.status_code == 200
    assert body["code"] == "200"
    assert isinstance(body["data"], list)
    assert len(body["data"]) >= 1
    assert "categoryName" in body["data"][0]


def test_knowledge_article_crud(client: TestClient, admin_headers: dict):
    categories = client.get("/api/knowledge/category/tree").json()["data"]
    category_id = categories[0]["id"]

    create_resp = client.post(
        "/api/knowledge/article",
        headers=admin_headers,
        json={
            "categoryId": category_id,
            "title": "测试文章",
            "summary": "摘要",
            "content": "<p>正文内容</p>",
            "coverImage": "",
            "tags": ["情绪管理", "测试"],
        },
    )
    assert create_resp.status_code == 200
    article_id = create_resp.json()["data"]["id"]

    publish_resp = client.put(
        f"/api/knowledge/article/{article_id}/status",
        headers=admin_headers,
        json={"status": 1},
    )
    assert publish_resp.status_code == 200
    assert publish_resp.json()["data"]["status"] == 1

    detail_resp = client.get(f"/api/knowledge/article/{article_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["data"]["title"] == "测试文章"

    page_resp = client.get(
        "/api/knowledge/article/page",
        params={"currentPage": "1", "size": "10", "sortField": "readCount", "sortDirection": "desc"},
    )
    assert page_resp.status_code == 200
    records = page_resp.json()["data"]["records"]
    assert any(item["id"] == article_id for item in records)

    update_resp = client.put(
        f"/api/knowledge/article/{article_id}",
        headers=admin_headers,
        json={
            "categoryId": category_id,
            "title": "更新后的文章",
            "summary": "新摘要",
            "content": "<p>更新正文</p>",
            "coverImage": "",
            "tags": "情绪管理",
        },
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["data"]["title"] == "更新后的文章"

    delete_resp = client.delete(
        f"/api/knowledge/article/{article_id}",
        headers=admin_headers,
    )
    assert delete_resp.status_code == 200


def test_file_upload(client: TestClient, user_headers: dict):
    file_content = b"fake-image-content"
    files = {"file": ("test.png", io.BytesIO(file_content), "image/png")}
    data = {
        "businessType": "ARTICLE",
        "businessId": "test-business-id",
        "businessField": "cover",
    }
    resp = client.post(
        "/api/file/upload",
        headers=user_headers,
        files=files,
        data=data,
    )
    body = resp.json()
    assert resp.status_code == 200
    assert body["code"] == "200"
    assert body["data"]["filePath"].startswith("/uploads/")
    assert body["data"]["originalName"] == "test.png"


def test_analytics_overview(client: TestClient, admin_headers: dict, user_headers: dict):
  # create some data
    client.post(
        "/api/emotion-diary",
        headers=user_headers,
        json={
            "diaryContent": "数据分析测试",
            "diaryDate": "2026-09-01",
            "dominantEmotion": "calm",
            "emotionTriggers": "测试",
            "moodScore": 7,
            "sleepQuality": 4,
            "stressLevel": 2,
        },
    )

    resp = client.get("/api/data-analytics/overview", headers=admin_headers)
    body = resp.json()
    assert resp.status_code == 200
    assert body["code"] == "200"
    data = body["data"]
    assert "systemOverview" in data
    assert "consultationStats" in data
    assert "emotionTrend" in data
    assert "userActivity" in data
    assert data["systemOverview"]["totalDiaries"] >= 1


def test_analytics_requires_admin(client: TestClient, user_headers: dict):
    resp = client.get("/api/data-analytics/overview", headers=user_headers)
    assert resp.status_code == 403
