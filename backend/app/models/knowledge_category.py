from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

STATUS_DISPLAY = {1: "启用", 0: "禁用"}


class KnowledgeCategory(Base):
    __tablename__ = "knowledge_categories"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    category_name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    articles: Mapped[list["KnowledgeArticle"]] = relationship(
        "KnowledgeArticle", back_populates="category"
    )

    @property
    def status_text(self) -> str:
        return STATUS_DISPLAY.get(self.status, "未知")

    @property
    def article_count(self) -> int:
        return len(self.articles) if self.articles else 0
