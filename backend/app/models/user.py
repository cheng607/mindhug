from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

GENDER_DISPLAY = {1: "男", 2: "女"}
STATUS_DISPLAY = {1: "正常", 0: "禁用"}
USER_TYPE_DISPLAY = {1: "普通用户", 2: "管理员"}


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    nickname: Mapped[str | None] = mapped_column(String(50))
    avatar: Mapped[str | None] = mapped_column(String(500), default="")
    phone: Mapped[str | None] = mapped_column(String(20), default="")
    gender: Mapped[int] = mapped_column(Integer, default=1)
    birthday: Mapped[date | None] = mapped_column(Date, nullable=True)
    role_id: Mapped[int] = mapped_column(ForeignKey("roles.id"), nullable=False)
    status: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    role: Mapped["Role"] = relationship("Role", back_populates="users")

    @property
    def user_type(self) -> int:
        return self.role.code if self.role else 1

    @property
    def gender_display_name(self) -> str:
        return GENDER_DISPLAY.get(self.gender, "未知")

    @property
    def status_display_name(self) -> str:
        return STATUS_DISPLAY.get(self.status, "未知")

    @property
    def user_type_display_name(self) -> str:
        return USER_TYPE_DISPLAY.get(self.user_type, "普通用户")

    @property
    def display_name(self) -> str:
        return self.nickname or self.username
