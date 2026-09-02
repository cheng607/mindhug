"""Sprint 5 AI single-agent tests."""
import json
import os
import uuid

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("DATABASE_URL", "sqlite:///./test_sprint5.db")
os.environ.setdefault("LLM_PROVIDER", "mock")

from app.core.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.models.role import Role  # noqa: E402
from app.services.emotion_service import analyze_session_by_rules, analyze_diary_by_rules


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
        "username": f"s5_user_{suffix}",
        "email": f"s5_{suffix}@example.com",
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


def test_emotion_service_crisis_rules():
    result = analyze_session_by_rules("我最近不想活了")
    assert result.primaryEmotion == "危机"
    assert result.riskLevel == 3
    assert result.isNegative is True


def test_emotion_service_anxiety_rules():
    result = analyze_session_by_rules("最近压力很大，失眠了")
    assert result.primaryEmotion == "焦虑"
    assert result.riskLevel == 2


def test_diary_emotion_rules():
    result = analyze_diary_by_rules("今天很开心", "happy", 8)
    assert result.isNegative is False
    assert result.riskLevel == 0


def test_stream_chat_mock_mode(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "S5流式测试"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    with client.stream(
        "POST",
        "/api/psychological-chat/stream",
        headers={**auth_headers, "Accept": "text/event-stream"},
        json={"sessionId": session_id, "userMessage": "最近压力很大，睡不着"},
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
        full_reply = "".join(chunks)
        assert len(full_reply) > 0

    messages_resp = client.get(
        f"/api/psychological-chat/sessions/{session_id}/messages",
        headers=auth_headers,
    )
    messages = messages_resp.json()["data"]
    assert len(messages) == 2
    assert messages[1]["senderType"] == 2


def test_async_emotion_analysis_endpoint(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/psychological-chat/session/start",
        headers=auth_headers,
        json={"sessionTitle": "情绪分析", "initialMessage": "我很焦虑"},
    )
    session_id = create_resp.json()["data"]["sessionId"]

    emotion_resp = client.get(
        f"/api/psychological-chat/session/{session_id}/emotion",
        headers=auth_headers,
    )
    body = emotion_resp.json()
    assert body["code"] == "200"
    assert body["data"]["primaryEmotion"] == "焦虑"
    assert isinstance(body["data"]["improvementSuggestions"], list)


def test_diary_async_analysis(client: TestClient, auth_headers: dict):
    create_resp = client.post(
        "/api/emotion-diary",
        headers=auth_headers,
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
    body = create_resp.json()
    assert body["data"]["aiAnalysisStatus"] == "PENDING"
    assert body["data"]["hasAiEmotionAnalysis"] is False

    diary_id = body["data"]["id"]
    db = SessionLocal()
    try:
        from app.models.emotion_diary import EmotionDiary
        diary = db.query(EmotionDiary).filter(EmotionDiary.id == diary_id).first()
        assert diary is not None
        assert diary.ai_analysis_status == "COMPLETED"
        assert diary.ai_emotion_analysis
    finally:
        db.close()
