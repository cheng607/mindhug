from sqlalchemy.orm import Session

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.role import Role
from app.models.user import User
from app.schemas.user import RegisterRequest


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def get_by_username_or_email(self, identifier: str) -> User | None:
        return (
            self.db.query(User)
            .filter((User.username == identifier) | (User.email == identifier))
            .first()
        )

    def get_by_id(self, user_id: int) -> User | None:
        return self.db.query(User).filter(User.id == user_id).first()

    def authenticate(self, identifier: str, password: str) -> User | None:
        user = self.get_by_username_or_email(identifier)
        if not user or not verify_password(password, user.password_hash):
            return None
        if user.status != 1:
            return None
        return user

    def create_user(self, data: RegisterRequest) -> User:
        if self.get_by_username_or_email(data.username):
            raise ValueError("用户名已存在")
        if self.db.query(User).filter(User.email == data.email).first():
            raise ValueError("邮箱已被注册")

        role = self.db.query(Role).filter(Role.code == 1).first()
        if not role:
            raise ValueError("系统角色未初始化")

        nickname = (data.nickname or "").strip() or data.username
        phone = (data.phone or "").strip()

        user = User(
            username=data.username,
            email=data.email,
            password_hash=get_password_hash(data.password),
            nickname=nickname,
            phone=phone,
            gender=data.gender,
            role_id=role.id,
            status=1,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_token_for_user(self, user: User) -> str:
        return create_access_token(str(user.id))
