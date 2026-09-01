from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

STATUS_PUBLISHED = 1
STATUS_DRAFT = 0
STATUS_DISPLAY = {STATUS_PUBLISHED: "已发布", STATUS_DRAFT: "草稿"}


class KnowledgeArticle(Base):
    __tablename__ = "knowledge_articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_id: Mapped[int] = mapped_column(
        ForeignKey("knowledge_categories.id"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    cover_image: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    tags: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    author_name: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    author_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    read_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[int] = mapped_column(Integer, nullable=False, default=STATUS_DRAFT)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    category: Mapped["KnowledgeCategory"] = relationship(
        "KnowledgeCategory", back_populates="articles"
    )

    @property
    def status_text(self) -> str:
        return STATUS_DISPLAY.get(self.status, "未知")

    @property
    def category_name(self) -> str:
        return self.category.category_name if self.category else ""
