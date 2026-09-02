"""创建或重置管理员账号。

用法（项目根目录或 backend 目录）：
  python scripts/create_admin.py
  python scripts/create_admin.py --username admin --password admin123456

Docker 生产栈：
  docker compose exec backend python scripts/create_admin.py
"""
from __future__ import annotations

import argparse
import os
import sys

# 允许从 backend/ 或容器 /app 运行
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models.role import Role
from app.models.user import User


def ensure_admin(username: str, password: str, email: str, nickname: str) -> User:
    db = SessionLocal()
    try:
        admin_role = db.query(Role).filter(Role.code == 2).first()
        if not admin_role:
            raise RuntimeError("roles 表未初始化，请先启动后端完成 seed")

        user = db.query(User).filter(User.username == username).first()
        if user:
            user.role_id = admin_role.id
            user.status = 1
            user.password_hash = get_password_hash(password)
            user.nickname = nickname or username
            if email:
                user.email = email
            db.commit()
            db.refresh(user)
            return user

        if db.query(User).filter(User.email == email).first():
            raise ValueError(f"邮箱 {email} 已被其他账号使用")

        user = User(
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            nickname=nickname or username,
            gender=1,
            role_id=admin_role.id,
            status=1,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Create or reset MindHug admin user")
    parser.add_argument("--username", default=os.getenv("ADMIN_USERNAME", "admin"))
    parser.add_argument("--password", default=os.getenv("ADMIN_PASSWORD", "admin123456"))
    parser.add_argument("--email", default=os.getenv("ADMIN_EMAIL", "admin@mindhug.local"))
    parser.add_argument("--nickname", default=os.getenv("ADMIN_NICKNAME", "系统管理员"))
    args = parser.parse_args()

    user = ensure_admin(args.username, args.password, args.email, args.nickname)
    print("Admin ready:")
    print(f"  username: {user.username}")
    print(f"  password: {args.password}")
    print(f"  email:    {user.email}")
    print("Login at /auth, then open /back/dashboard")


if __name__ == "__main__":
    main()
