"""消息编辑/删除/重新生成 API 测试。"""
import json
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_message_actions.db")

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


def _auth(client: TestClient) -> dict:
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"msg_{suffix}",
        "email": f"msg_{suffix}@example.com",
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
    token = login.json()["data"]["token"]
    headers = {"token": token}

    start = client.post(
        "/api/psychological-chat/session/start",
        json={"sessionTitle": "消息测试"},
        headers=headers,
    )
    session_id = start.json()["data"]["sessionId"]

    with client.stream(
        "POST",
        "/api/psychological-chat/stream",
        headers={**headers, "Accept": "text/event-stream"},
        json={"sessionId": session_id, "userMessage": "你好，我想聊聊"},
    ) as response:
        assert response.status_code == 200
        for line in response.iter_lines():
            if line.startswith("data: ") and line[6:] == "[DONE]":
                break

    messages = client.get(
        f"/api/psychological-chat/sessions/{session_id}/messages",
        headers=headers,
    ).json()["data"]
    return {
        "headers": headers,
        "session_id": session_id,
        "messages": messages,
    }


def test_update_user_message(client: TestClient):
    ctx = _auth(client)
    user_msg = next(m for m in ctx["messages"] if m["senderType"] == 1)
    resp = client.put(
        f"/api/psychological-chat/sessions/{ctx['session_id']}/messages/{user_msg['id']}",
        headers=ctx["headers"],
        json={"content": "更新后的用户消息"},
    )
    body = resp.json()
    assert resp.status_code == 200
    assert body["data"]["content"] == "更新后的用户消息"
    remaining = client.get(
        f"/api/psychological-chat/sessions/{ctx['session_id']}/messages",
        headers=ctx["headers"],
    ).json()["data"]
    assert len(remaining) == 1
    assert remaining[0]["senderType"] == 1


def test_delete_message(client: TestClient):
    ctx = _auth(client)
    ai_msg = next(m for m in ctx["messages"] if m["senderType"] == 2)
    resp = client.delete(
        f"/api/psychological-chat/sessions/{ctx['session_id']}/messages/{ai_msg['id']}",
        headers=ctx["headers"],
    )
    assert resp.status_code == 200
    remaining = client.get(
        f"/api/psychological-chat/sessions/{ctx['session_id']}/messages",
        headers=ctx["headers"],
    ).json()["data"]
    assert all(m["senderType"] == 1 for m in remaining)


def test_regenerate_ai_message(client: TestClient):
    ctx = _auth(client)
    ai_msg = next(m for m in ctx["messages"] if m["senderType"] == 2)
    with client.stream(
        "POST",
        f"/api/psychological-chat/sessions/{ctx['session_id']}/messages/{ai_msg['id']}/regenerate",
        headers={**ctx["headers"], "Accept": "text/event-stream"},
    ) as response:
        assert response.status_code == 200
        # Drain full SSE body so async generator completes and persists AI reply
        _ = response.read()

    messages = client.get(
        f"/api/psychological-chat/sessions/{ctx['session_id']}/messages",
        headers=ctx["headers"],
    ).json()["data"]
    assert len(messages) == 2
    assert messages[-1]["senderType"] == 2
    assert len(messages[-1]["content"]) > 0
