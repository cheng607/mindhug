from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

BUSINESS_TYPE_DESC = {
    "ARTICLE": "知识文章",
    "AVATAR": "用户头像",
    "DIARY": "情绪日记",
}

FILE_TYPE_DESC = {
    "image": "图片",
    "document": "文档",
    "video": "视频",
    "other": "其他",
}


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    original_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False, default="other")
    file_extension: Mapped[str] = mapped_column(String(20), nullable=False, default="")
    business_type: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    business_id: Mapped[str] = mapped_column(String(100), nullable=False, default="")
    business_field: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    status: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    is_temp: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_expired: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    @property
    def business_type_desc(self) -> str:
        return BUSINESS_TYPE_DESC.get(self.business_type, self.business_type)

    @property
    def file_type_desc(self) -> str:
        return FILE_TYPE_DESC.get(self.file_type, self.file_type)
