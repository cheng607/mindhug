from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

STATUS_PENDING = "pending"
STATUS_PROCESSING = "processing"
STATUS_RESOLVED = "resolved"

STATUS_DISPLAY = {
    STATUS_PENDING: "待处理",
    STATUS_PROCESSING: "处理中",
    STATUS_RESOLVED: "已处理",
}


class RiskAlert(Base):
    __tablename__ = "risk_alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    session_id: Mapped[int | None] = mapped_column(
        ForeignKey("chat_sessions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    risk_level: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    trigger_reason: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    user_message: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String(20), nullable=False, default=STATUS_PENDING)
    admin_note: Mapped[str] = mapped_column(Text, nullable=False, default="")
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User")
    session: Mapped["ChatSession | None"] = relationship("ChatSession")

    @property
    def status_text(self) -> str:
        return STATUS_DISPLAY.get(self.status, self.status)
