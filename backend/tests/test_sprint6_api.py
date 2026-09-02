"""Sprint 6 multi-agent orchestration tests."""
import json
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sprint6.db")
os.environ.setdefault("LLM_PROVIDER", "mock")

from app.agents.router import classify_intent  # noqa: E402
from app.agents.types import IntentType  # noqa: E402
from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.agent_execution_log import AgentExecutionLog  # noqa: E402
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
        "username": f"s6_user_{suffix}",
        "email": f"s6_{suffix}@example.com",
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


def test_router_crisis_intent():
    assert classify_intent("我不想活了") == "crisis"


def test_router_counsel_intent():
    assert classify_intent("最近压力很大，有什么建议吗") == "counsel"


def test_router_knowledge_intent():
    assert classify_intent("什么是焦虑症") == "knowledge"


def test_router_listen_intent():
    assert classify_intent("今天心情不太好，想找人聊聊") == "listen"


def test_router_counsel_after_multi_turn():
    from app.models.chat_session import SENDER_USER
    from app.models.message import Message

    history = [
        Message(id=1, session_id=1, content="最近感觉好烦", sender_type=SENDER_USER, message_type=1),
        Message(id=2, session_id=1, content="...", sender_type=2, message_type=1),
        Message(id=3, session_id=1, content="工作不太顺利", sender_type=SENDER_USER, message_type=1),
    ]
    assert classify_intent("找工作不顺利，而且面试感觉总是有问题", history) == "counsel"


def test_router_knowledge_impact_intent():
    assert classify_intent("下雨对情绪有什么影响") == "knowledge"


def test_router_knowledge_tell_me_intent():
    assert classify_intent("告诉我什么是焦虑症") == "knowledge"


def test_router_off_topic_tech_intent():
    assert classify_intent("告诉我前端技术") == "knowledge"
    assert classify_intent("前端怎么学") == "knowledge"


def test_router_share_not_knowledge():
    assert classify_intent("今天心情不太好，想找人聊聊") == "listen"
    assert classify_intent("最近好累，想说说心里话") == "listen"


ROUTER_INTENT_SAMPLES: list[tuple[str, IntentType]] = [
    ("我不想活了", "crisis"),
    ("我想结束生命", "crisis"),
    ("什么是焦虑症", "knowledge"),
    ("告诉我什么是抑郁症", "knowledge"),
    ("下雨对情绪有什么影响", "knowledge"),
    ("焦虑的原因有哪些", "knowledge"),
    ("最近压力很大，有什么建议吗", "counsel"),
    ("失眠怎么办", "counsel"),
    ("我该如何缓解焦虑", "counsel"),
    ("今天心情不太好，想找人聊聊", "listen"),
    ("最近好累，想说说心里话", "listen"),
    ("感觉今天有点累啊", "listen"),
    ("告诉我前端技术", "knowledge"),
    ("React 框架怎么学", "knowledge"),
    ("Python 编程入门", "knowledge"),
    ("工作压力让我焦虑怎么办", "counsel"),
    ("科普一下正念冥想", "knowledge"),
    ("为什么我会突然很难过", "knowledge"),
    ("好烦，没人理解我", "listen"),
    ("面试总是失败，我该怎么办", "counsel"),
]


@pytest.mark.parametrize("message,expected", ROUTER_INTENT_SAMPLES)
def test_router_intent_accuracy(message: str, expected: IntentType):
    assert classify_intent(message) == expected


def test_mock_off_topic_redirect():
    from app.agents.mock_reply import build_mock_reply

    reply = build_mock_reply("告诉我前端的技术", "listen")
    assert "心理健康助手" in reply
    assert "前端" in reply
    assert "无力或委屈" not in reply


def test_listen_mock_follow_up_differs():
    from app.agents.mock_reply import build_listen_mock
    from app.models.chat_session import SENDER_AI, SENDER_USER
    from app.models.message import Message

    first = build_listen_mock("感觉今天有点累啊", [])
    history = [
        Message(id=1, session_id=1, content="感觉今天有点累啊", sender_type=SENDER_USER, message_type=1),
        Message(id=2, session_id=1, content=first, sender_type=SENDER_AI, message_type=1),
    ]
    second = build_listen_mock("最近天气一直下雨，感觉工作也不是很顺利", history)
    assert first != second
    assert "「" not in second  # 不再机械复述引号


def test_listen_mock_links_context():
    from app.agents.mock_reply import build_listen_mock
    from app.models.chat_session import SENDER_AI, SENDER_USER
    from app.models.message import Message

    first = build_listen_mock("最近感觉好烦", [])
    history = [
        Message(id=1, session_id=1, content="最近感觉好烦", sender_type=SENDER_USER, message_type=1),
        Message(id=2, session_id=1, content=first, sender_type=SENDER_AI, message_type=1),
    ]
    second = build_listen_mock("工作不太顺利", history)
    assert "工作" in second or "烦" in second or "烦躁" in second
    assert "叠加在一起" not in second


def test_should_supplement_rag_for_counsel():
    from app.agents.mock_reply import should_supplement_rag

    assert should_supplement_rag("counsel", "最近失眠怎么办") is True
    assert should_supplement_rag("listen", "今天有点累") is True
    assert should_supplement_rag("listen", "你好") is False


def test_stream_includes_agent_metadata(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "Agent测试"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    agent_meta = None
    with client.stream(
        "POST",
        "/api/psychological-chat/stream",
        headers={**auth_headers, "Accept": "text/event-stream"},
        json={"sessionId": session_id, "userMessage": "什么是焦虑症"},
    ) as response:
        assert response.status_code == 200
        for line in response.iter_lines():
            if not line.startswith("data: "):
                continue
            payload = line[6:]
            if payload == "[DONE]":
                break
            data = json.loads(payload)
            if "agent" in data:
                agent_meta = data
                break

    assert agent_meta is not None
    assert agent_meta["agent"] == "knowledge"
    assert agent_meta["agentName"] == "知识 Agent"


def test_agent_execution_log_created(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "日志测试"},
    )
    session_id = int(create_resp.json()["data"]["sessionId"])

    with client.stream(
        "POST",
        "/api/psychological-chat/stream",
        headers={**auth_headers, "Accept": "text/event-stream"},
        json={"sessionId": str(session_id), "userMessage": "最近失眠怎么办"},
    ) as response:
        assert response.status_code == 200
        for line in response.iter_lines():
            if line.startswith("data: ") and line[6:] == "[DONE]":
                break

    db = SessionLocal()
    try:
        logs = db.query(AgentExecutionLog).filter(AgentExecutionLog.session_id == session_id).all()
        assert len(logs) >= 1
        assert logs[-1].intent == "counsel"
        assert logs[-1].active_agent == "咨询 Agent"
    finally:
        db.close()
