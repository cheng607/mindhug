from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.chat_session import MESSAGE_TYPE_DISPLAY, MESSAGE_TYPE_TEXT, SENDER_DISPLAY


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sender_type: Mapped[int] = mapped_column(Integer, nullable=False)
    message_type: Mapped[int] = mapped_column(Integer, nullable=False, default=MESSAGE_TYPE_TEXT)
    citations: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    session: Mapped["ChatSession"] = relationship("ChatSession", back_populates="messages")

    @property
    def content_length(self) -> int:
        return len(self.content)

    @property
    def content_preview(self) -> str:
        return self.content[:50] if self.content else ""

    @property
    def sender_type_desc(self) -> str:
        return SENDER_DISPLAY.get(self.sender_type, "未知")

    @property
    def message_type_desc(self) -> str:
        return MESSAGE_TYPE_DISPLAY.get(self.message_type, "未知")
