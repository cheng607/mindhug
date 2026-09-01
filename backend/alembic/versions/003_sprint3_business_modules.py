"""003 sprint3 business modules

Revision ID: 003
Revises: 002
Create Date: 2026-09-01

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "emotion_diaries",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("diary_content", sa.Text(), nullable=False),
        sa.Column("diary_date", sa.Date(), nullable=False),
        sa.Column("dominant_emotion", sa.String(length=50), nullable=False),
        sa.Column("emotion_triggers", sa.Text(), nullable=False),
        sa.Column("mood_score", sa.Integer(), nullable=False),
        sa.Column("sleep_quality", sa.Integer(), nullable=False),
        sa.Column("stress_level", sa.Integer(), nullable=False),
        sa.Column("ai_analysis_status", sa.String(length=20), nullable=False),
        sa.Column("ai_emotion_analysis", sa.Text(), nullable=True),
        sa.Column("ai_analysis_updated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_emotion_diaries_user_id"), "emotion_diaries", ["user_id"], unique=False)
    op.create_index(op.f("ix_emotion_diaries_diary_date"), "emotion_diaries", ["diary_date"], unique=False)

    op.create_table(
        "knowledge_categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("category_name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False),
        sa.Column("status", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "knowledge_articles",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("cover_image", sa.String(length=500), nullable=False),
        sa.Column("tags", sa.String(length=500), nullable=False),
        sa.Column("author_name", sa.String(length=100), nullable=False),
        sa.Column("author_id", sa.Integer(), nullable=True),
        sa.Column("read_count", sa.Integer(), nullable=False),
        sa.Column("status", sa.Integer(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["category_id"], ["knowledge_categories.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_knowledge_articles_category_id"),
        "knowledge_articles",
        ["category_id"],
        unique=False,
    )

    op.create_table(
        "uploaded_files",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
        sa.Column("file_path", sa.String(length=500), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("file_type", sa.String(length=50), nullable=False),
        sa.Column("file_extension", sa.String(length=20), nullable=False),
        sa.Column("business_type", sa.String(length=50), nullable=False),
        sa.Column("business_id", sa.String(length=100), nullable=False),
        sa.Column("business_field", sa.String(length=50), nullable=False),
        sa.Column("status", sa.Integer(), nullable=False),
        sa.Column("is_temp", sa.Boolean(), nullable=False),
        sa.Column("is_expired", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )


def downgrade() -> None:
    op.drop_table("uploaded_files")
    op.drop_index(op.f("ix_knowledge_articles_category_id"), table_name="knowledge_articles")
    op.drop_table("knowledge_articles")
    op.drop_table("knowledge_categories")
    op.drop_index(op.f("ix_emotion_diaries_diary_date"), table_name="emotion_diaries")
    op.drop_index(op.f("ix_emotion_diaries_user_id"), table_name="emotion_diaries")
    op.drop_table("emotion_diaries")
