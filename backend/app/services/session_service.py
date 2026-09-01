import math
import re
from datetime import datetime, timedelta, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.models.chat_session import SENDER_AI, SENDER_USER, ChatSession
from app.models.message import Message
from app.models.user import User
from app.schemas.session import (
    MessageResponse,
    SessionItemResponse,
    SessionPageResponse,
    StartSessionResponse,
)

MOCK_AI_RESPONSE = (
    "我能感受到你现在的不容易。愿意把这些感受说出来，本身就是很重要的一步。\n\n"
    "你可以先试着做几次深呼吸，把注意力慢慢带回当下。"
    "如果愿意，也可以告诉我：最近最让你困扰的具体事情是什么？"
)

CRISIS_KEYWORDS = ("自杀", "不想活", "结束生命", "自残", "割腕")


def parse_session_id(session_id: str) -> int:
    cleaned = session_id.strip()
    if cleaned.startswith("session_"):
        cleaned = cleaned[len("session_") :]
    return int(cleaned)


def _to_iso(dt: datetime | None) -> str:
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def build_message_response(message: Message) -> MessageResponse:
    return MessageResponse(
        id=message.id,
        sessionId=message.session_id,
        content=message.content,
        contentLength=message.content_length,
        contentPreview=message.content_preview,
        senderType=message.sender_type,
        senderTypeDesc=message.sender_type_desc,
        messageType=message.message_type,
        messageTypeDesc=message.message_type_desc,
        createdAt=_to_iso(message.created_at),
    )


def build_session_item(session: ChatSession, user: User) -> SessionItemResponse:
    return SessionItemResponse(
        id=session.id,
        sessionTitle=session.session_title,
        userId=session.user_id,
        userNickname=user.display_name,
        startedAt=_to_iso(session.started_at),
        lastMessageTime=_to_iso(session.last_message_time or session.started_at),
        lastMessageContent=session.last_message_content or "",
        messageCount=session.message_count,
        durationMinutes=session.duration_minutes,
    )


class SessionService:
    def __init__(self, db: Session):
        self.db = db

    def _get_owned_session(self, session_id: int, user_id: int) -> ChatSession | None:
        return (
            self.db.query(ChatSession)
            .filter(ChatSession.id == session_id, ChatSession.user_id == user_id)
            .first()
        )

    def session_exists_for_user(self, session_id: int, user: User) -> bool:
        return self._get_owned_session(session_id, user.id) is not None

    def list_sessions(
        self,
        user: User,
        page_num: int = 1,
        page_size: int = 20,
        emotion_tag: str = "",
    ) -> SessionPageResponse:
        query = self.db.query(ChatSession).filter(ChatSession.user_id == user.id)
        if emotion_tag:
            query = query.filter(ChatSession.emotion_tag == emotion_tag)

        total = query.count()
        pages = max(math.ceil(total / page_size), 1) if page_size else 1
        current = min(max(page_num, 1), pages) if total else 1
        offset = (current - 1) * page_size

        sessions = (
            query.order_by(desc(ChatSession.last_message_time), desc(ChatSession.id))
            .offset(offset)
            .limit(page_size)
            .all()
        )

        records = [build_session_item(item, user) for item in sessions]
        return SessionPageResponse(
            records=records,
            total=total,
            size=page_size,
            current=current,
            pages=pages,
        )

    def start_session(
        self,
        user: User,
        session_title: str = "新会话",
        initial_message: str = "",
    ) -> StartSessionResponse:
        now = datetime.now(timezone.utc)
        session = ChatSession(
            user_id=user.id,
            session_title=session_title or "新会话",
            status="ACTIVE",
            started_at=now,
            updated_at=now,
        )
        self.db.add(session)
        self.db.flush()

        message_count = 0
        if initial_message and initial_message.strip():
            self._add_message(session, initial_message.strip(), SENDER_USER)
            message_count = 1

        self.db.commit()
        self.db.refresh(session)

        return StartSessionResponse(
            sessionId=str(session.id),
            status=session.status,
            startTime=int(session.started_at.timestamp() * 1000),
            expiryTime=int((session.started_at + timedelta(days=7)).timestamp() * 1000),
            initialMessage=initial_message or "",
            messageCount=message_count,
            userHash=user.id,
        )

    def get_messages(self, session_id: int, user: User) -> list[MessageResponse]:
        session = self._get_owned_session(session_id, user.id)
        if not session:
            raise ValueError("会话不存在或无权访问")

        messages = (
            self.db.query(Message)
            .filter(Message.session_id == session_id)
            .order_by(Message.created_at.asc(), Message.id.asc())
            .all()
        )
        return [build_message_response(item) for item in messages]

    def delete_session(self, session_id: int, user: User) -> None:
        session = self._get_owned_session(session_id, user.id)
        if not session:
            raise ValueError("会话不存在或无权访问")
        self.db.delete(session)
        self.db.commit()

    def _add_message(self, session: ChatSession, content: str, sender_type: int) -> Message:
        now = datetime.now(timezone.utc)
        message = Message(
            session_id=session.id,
            content=content,
            sender_type=sender_type,
        )
        self.db.add(message)
        session.message_count += 1
        session.last_message_content = content
        session.last_message_time = now
        session.updated_at = now
        return message

    def save_user_message(self, session_id: int, user: User, content: str) -> ChatSession:
        session = self._get_owned_session(session_id, user.id)
        if not session:
            raise ValueError("会话不存在或无权访问")
        self._add_message(session, content, SENDER_USER)
        self.db.commit()
        self.db.refresh(session)
        return session

    def save_ai_message(self, session_id: int, user: User, content: str) -> Message:
        session = self._get_owned_session(session_id, user.id)
        if not session:
            raise ValueError("会话不存在或无权访问")
        message = self._add_message(session, content, SENDER_AI)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_session_user_content(self, session_id: int, user: User) -> str:
        session = self._get_owned_session(session_id, user.id)
        if not session:
            raise ValueError("会话不存在或无权访问")

        messages = (
            self.db.query(Message)
            .filter(Message.session_id == session_id, Message.sender_type == SENDER_USER)
            .order_by(Message.created_at.desc())
            .limit(10)
            .all()
        )
        return " ".join(item.content for item in reversed(messages))

    def build_mock_reply(self, user_message: str) -> str:
        if any(keyword in user_message for keyword in CRISIS_KEYWORDS):
            return (
                "我听到你现在非常痛苦，这一定很难熬。"
                "请你知道，你值得被帮助。\n\n"
                "**如果你正处于危险中，请立即拨打 400-161-9995 或 110 寻求帮助。**"
            )
        if re.search(r"(建议|怎么办|如何|帮助)", user_message):
            return (
                f"关于「{user_message[:20]}」，我想先确认一下："
                "这件事里，最让你感到压力的部分是什么？\n\n"
                + MOCK_AI_RESPONSE
            )
        return MOCK_AI_RESPONSE
