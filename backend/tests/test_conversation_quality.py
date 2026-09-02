"""多轮对话质量验收：路由切换、回复差异、禁套话。"""
import json
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_conversation_quality.db")
os.environ.setdefault("LLM_PROVIDER", "mock")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.agent_execution_log import AgentExecutionLog  # noqa: E402
from app.models.message import Message  # noqa: E402
from app.models.role import Role  # noqa: E402

BANNED_TEMPLATE_PHRASES = ("我听到", "听起来你", "这一定很不容易", "叠加在一起")


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
        "username": f"qa_user_{suffix}",
        "email": f"qa_{suffix}@example.com",
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


def _stream_reply(client: TestClient, headers: dict, session_id: str, user_message: str) -> tuple[str, str | None]:
    """返回 (完整回复文本, agent intent)。"""
    content_parts: list[str] = []
    agent_intent: str | None = None
    with client.stream(
        "POST",
        "/api/psychological-chat/stream",
        headers={**headers, "Accept": "text/event-stream"},
        json={"sessionId": session_id, "userMessage": user_message},
    ) as response:
        assert response.status_code == 200
        for line in response.iter_lines():
            if not line.startswith("data: "):
                continue
            payload = line[6:]
            if payload == "[DONE]":
                break
            data = json.loads(payload)
            if "agent" in data and "agentName" in data:
                agent_intent = data["agent"]
            if "content" in data and data["content"]:
                content_parts.append(data["content"])
    return "".join(content_parts), agent_intent


@pytest.mark.parametrize(
    "turns,expected_final_intent",
    [
        (
            ["最近感觉好烦", "工作不太顺利", "面试总是失败，我该怎么办"],
            "counsel",
        ),
        (
            ["今天心情不太好，想找人聊聊", "最近好累", "压力好大"],
            "counsel",
        ),
    ],
)
def test_multi_turn_routes_to_counsel(
    client: TestClient,
    auth_headers: dict,
    turns: list[str],
    expected_final_intent: str,
):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "质量验收"},
    )
    session_id = create_resp.json()["data"]["sessionId"]
    replies: list[str] = []
    intents: list[str | None] = []

    for message in turns:
        reply, intent = _stream_reply(client, auth_headers, session_id, message)
        replies.append(reply)
        intents.append(intent)

    assert intents[0] == "listen"
    assert intents[-1] == expected_final_intent
    assert len(set(replies)) == len(replies), "各轮回复不应完全相同"
    for reply in replies:
        assert reply.strip(), "回复不应为空"
        for phrase in BANNED_TEMPLATE_PHRASES:
            assert phrase not in reply, f"回复含模板套话「{phrase}」"


def test_multi_turn_context_linked_in_mock(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "上下文连贯"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    _stream_reply(client, auth_headers, session_id, "最近感觉好烦")
    second_reply, _ = _stream_reply(client, auth_headers, session_id, "工作不太顺利")

    assert "工作" in second_reply or "烦" in second_reply or "烦躁" in second_reply


def test_session_message_order_user_before_ai(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "顺序验收"},
    )
    session_id = int(create_resp.json()["data"]["sessionId"])

    _stream_reply(client, auth_headers, str(session_id), "感觉今天有点累啊")
    _stream_reply(client, auth_headers, str(session_id), "最近天气一直下雨")

    db = SessionLocal()
    try:
        messages = (
            db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )
        assert len(messages) >= 4
        for index in range(0, len(messages) - 1, 2):
            assert messages[index].sender_type == 1
            assert messages[index + 1].sender_type == 2
    finally:
        db.close()


def test_agent_logs_record_multi_turn(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "日志验收"},
    )
    session_id = int(create_resp.json()["data"]["sessionId"])

    for message in ("最近失眠", "工作压力很大", "我该如何缓解焦虑"):
        _stream_reply(client, auth_headers, str(session_id), message)

    db = SessionLocal()
    try:
        logs = (
            db.query(AgentExecutionLog)
            .filter(AgentExecutionLog.session_id == session_id)
            .order_by(AgentExecutionLog.id.asc())
            .all()
        )
        assert len(logs) == 3
        assert logs[0].intent == "listen"
        assert logs[-1].intent == "counsel"
    finally:
        db.close()
