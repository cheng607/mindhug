from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

SENDER_USER = 1
SENDER_AI = 2
MESSAGE_TYPE_TEXT = 1

SENDER_DISPLAY = {SENDER_USER: "用户", SENDER_AI: "AI助手"}
MESSAGE_TYPE_DISPLAY = {MESSAGE_TYPE_TEXT: "文本"}


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    session_title: Mapped[str] = mapped_column(String(200), nullable=False, default="新会话")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="ACTIVE")
    emotion_tag: Mapped[str | None] = mapped_column(String(50), nullable=True)
    last_message_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    last_message_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    message_count: Mapped[int] = mapped_column(Integer, default=0)
    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="chat_sessions")
    messages: Mapped[list["Message"]] = relationship(
        "Message", back_populates="session", cascade="all, delete-orphan"
    )

    @property
    def duration_minutes(self) -> int:
        end = self.last_message_time or self.updated_at or self.started_at
        delta = end - self.started_at
        return max(int(delta.total_seconds() // 60), 0)
