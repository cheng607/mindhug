"""002 chat session and message tables

Revision ID: 002
Revises: 001
Create Date: 2026-09-01

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chat_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("session_title", sa.String(length=200), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("emotion_tag", sa.String(length=50), nullable=True),
        sa.Column("last_message_content", sa.Text(), nullable=True),
        sa.Column("last_message_time", sa.DateTime(timezone=True), nullable=True),
        sa.Column("message_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_chat_sessions_user_id"), "chat_sessions", ["user_id"], unique=False)

    op.create_table(
        "messages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("sender_type", sa.Integer(), nullable=False),
        sa.Column("message_type", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["chat_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_messages_session_id"), "messages", ["session_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_messages_session_id"), table_name="messages")
    op.drop_table("messages")
    op.drop_index(op.f("ix_chat_sessions_user_id"), table_name="chat_sessions")
    op.drop_table("chat_sessions")
