from sqlalchemy.orm import Session, joinedload

from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.role import Role
from app.models.user import User
from app.schemas.user import RegisterRequest, UpdateProfileRequest, build_user_info, UserInfoResponse


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

    def update_profile(self, user_id: int, data: UpdateProfileRequest) -> User:
        user = self.get_by_id(user_id)
        if not user:
            raise ValueError("用户不存在")
        if data.nickname is not None:
            user.nickname = data.nickname.strip() or user.username
        if data.phone is not None:
            user.phone = data.phone.strip()
        if data.gender is not None:
            user.gender = data.gender
        self.db.commit()
        self.db.refresh(user)
        return user

    def change_password(self, user_id: int, old_password: str, new_password: str) -> None:
        user = self.get_by_id(user_id)
        if not user:
            raise ValueError("用户不存在")
        if not verify_password(old_password, user.password_hash):
            raise ValueError("原密码错误")
        if old_password == new_password:
            raise ValueError("新密码不能与原密码相同")
        user.password_hash = get_password_hash(new_password)
        self.db.commit()

    def list_users_admin(
        self,
        page_num: int = 1,
        page_size: int = 20,
        username: str = "",
        status: int | None = None,
    ) -> dict:
        import math

        query = self.db.query(User).options(joinedload(User.role))
        if username.strip():
            pattern = f"%{username.strip()}%"
            query = query.filter(
                (User.username.like(pattern))
                | (User.email.like(pattern))
                | (User.nickname.like(pattern))
            )
        if status is not None:
            query = query.filter(User.status == status)

        total = query.count()
        pages = max(math.ceil(total / page_size), 1) if page_size else 1
        current = min(max(page_num, 1), pages) if total else 1
        offset = (current - 1) * page_size

        users = (
            query.order_by(User.created_at.desc(), User.id.desc())
            .offset(offset)
            .limit(page_size)
            .all()
        )
        records = [build_user_info(user).model_dump() for user in users]
        return {
            "records": records,
            "total": total,
            "size": page_size,
            "current": current,
            "pages": pages,
        }

    def update_user_status(self, admin: User, user_id: int, status: int) -> UserInfoResponse:
        if admin.id == user_id and status == 0:
            raise ValueError("不能封禁自己的账号")
        user = self.get_by_id(user_id)
        if not user:
            raise ValueError("用户不存在")
        user.status = status
        self.db.commit()
        self.db.refresh(user)
        return build_user_info(user)

    def update_user_role(self, admin: User, user_id: int, role_code: int) -> UserInfoResponse:
        if admin.id == user_id:
            raise ValueError("不能修改自己的角色")
        user = self.get_by_id(user_id)
        if not user:
            raise ValueError("用户不存在")
        role = self.db.query(Role).filter(Role.code == role_code).first()
        if not role:
            raise ValueError("角色不存在")
        user.role_id = role.id
        self.db.commit()
        self.db.refresh(user)
        return build_user_info(user)
