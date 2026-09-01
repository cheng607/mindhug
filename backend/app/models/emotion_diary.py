from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

AI_STATUS_PENDING = "PENDING"
AI_STATUS_COMPLETED = "COMPLETED"


class EmotionDiary(Base):
    __tablename__ = "emotion_diaries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    diary_content: Mapped[str] = mapped_column(Text, nullable=False)
    diary_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    dominant_emotion: Mapped[str] = mapped_column(String(50), nullable=False)
    emotion_triggers: Mapped[str] = mapped_column(Text, nullable=False, default="")
    mood_score: Mapped[int] = mapped_column(Integer, nullable=False)
    sleep_quality: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    stress_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    ai_analysis_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=AI_STATUS_PENDING
    )
    ai_emotion_analysis: Mapped[str | None] = mapped_column(Text, nullable=True)
    ai_analysis_updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="emotion_diaries")

    @property
    def content_length(self) -> int:
        return len(self.diary_content or "")

    @property
    def diary_content_preview(self) -> str:
        content = self.diary_content or ""
        return content[:50] + ("..." if len(content) > 50 else "")

    @property
    def has_ai_emotion_analysis(self) -> bool:
        return bool(self.ai_emotion_analysis)
