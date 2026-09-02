"""Sprint 2 session API tests."""
import json
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sprint2.db")

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
def auth_headers(client: TestClient):
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"s2_user_{suffix}",
        "email": f"s2_{suffix}@example.com",
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
    return {"token": token}


def test_sessions_require_auth(client: TestClient):
    resp = client.get("/api/psychological-chat/sessions")
    assert resp.status_code == 401
    assert resp.json()["code"] == "401"


def test_create_and_list_sessions(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "测试会话", "initialMessage": "你好"},
    )
    body = create_resp.json()
    assert create_resp.status_code == 200
    assert body["code"] == "200"
    assert body["data"]["sessionId"]
    assert body["data"]["status"] == "ACTIVE"
    assert body["data"]["messageCount"] == 1

    list_resp = client.get(
        "/api/psychological-chat/sessions",
        headers=auth_headers,
        params={"pageNum": "1", "pageSize": "10"},
    )
    list_body = list_resp.json()
    assert list_body["code"] == "200"
    assert list_body["data"]["total"] >= 1
    assert len(list_body["data"]["records"]) >= 1
    record = list_body["data"]["records"][0]
    assert "sessionTitle" in record
    assert "durationMinutes" in record
    assert "lastMessageContent" in record


def test_get_session_messages(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "消息测试", "initialMessage": "第一条消息"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    messages_resp = client.get(
        f"/api/psychological-chat/sessions/{session_id}/messages",
        headers=auth_headers,
    )
    messages = messages_resp.json()["data"]
    assert messages_resp.status_code == 200
    assert len(messages) == 1
    assert messages[0]["content"] == "第一条消息"
    assert messages[0]["senderType"] == 1
    assert messages[0]["senderTypeDesc"] == "用户"


def test_delete_session(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "待删除"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    delete_resp = client.delete(
        f"/api/psychological-chat/sessions/{session_id}",
        headers=auth_headers,
    )
    assert delete_resp.status_code == 200
    assert delete_resp.json()["code"] == "200"

    messages_resp = client.get(
        f"/api/psychological-chat/sessions/{session_id}/messages",
        headers=auth_headers,
    )
    assert messages_resp.status_code == 404


def test_stream_mock_response(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "流式测试"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    with client.stream(
        "POST",
        "/api/psychological-chat/stream",
        headers={**auth_headers, "Accept": "text/event-stream"},
        json={"sessionId": session_id, "userMessage": "最近压力很大"},
    ) as response:
        assert response.status_code == 200
        chunks = []
        done = False
        for line in response.iter_lines():
            if not line.startswith("data: "):
                continue
            payload = line[6:]
            if payload == "[DONE]":
                done = True
                break
            data = json.loads(payload)
            if "content" in data:
                chunks.append(data["content"])
        assert done is True
        assert "".join(chunks)

    messages_resp = client.get(
        f"/api/psychological-chat/sessions/{session_id}/messages",
        headers=auth_headers,
    )
    messages = messages_resp.json()["data"]
    assert len(messages) == 2
    assert messages[0]["senderType"] == 1
    assert messages[1]["senderType"] == 2
    assert messages[1]["content"]


def test_emotion_analysis_with_session_prefix(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "情绪测试", "initialMessage": "我最近很焦虑，失眠了"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    emotion_resp = client.get(
        f"/api/psychological-chat/session/session_{session_id}/emotion",
        headers=auth_headers,
    )
    body = emotion_resp.json()
    assert emotion_resp.status_code == 200
    assert body["code"] == "200"
    data = body["data"]
    assert data["primaryEmotion"] == "焦虑"
    assert data["isNegative"] is True
    assert data["riskLevel"] == 2
    assert isinstance(data["improvementSuggestions"], list)


def test_crisis_emotion_analysis(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "危机测试", "initialMessage": "我不想活了"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    emotion_resp = client.get(
        f"/api/psychological-chat/session/{session_id}/emotion",
        headers=auth_headers,
    )
    data = emotion_resp.json()["data"]
    assert data["primaryEmotion"] == "危机"
    assert data["riskLevel"] == 3


def test_invalid_session_id_returns_400(client: TestClient, auth_headers: dict):
    resp = client.get(
        "/api/psychological-chat/sessions/abc/messages",
        headers=auth_headers,
    )
    body = resp.json()
    assert resp.status_code == 400
    assert body["code"] == "400"
    assert body["msg"] == "无效的会话 ID"


def test_stream_nonexistent_session_returns_404(client: TestClient, auth_headers: dict):
    resp = client.post(
        "/api/psychological-chat/stream",
        headers={**auth_headers, "Accept": "text/event-stream"},
        json={"sessionId": "99999", "userMessage": "你好"},
    )
    body = resp.json()
    assert resp.status_code == 404
    assert body["code"] == "404"
    assert "会话不存在" in body["msg"]
