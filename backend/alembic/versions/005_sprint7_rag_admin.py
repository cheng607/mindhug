"""Sprint 7: RAG chunks, risk alerts, agent prompt configs"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005_sprint7_rag_admin"
down_revision: Union[str, None] = "004_agent_execution_logs"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "article_chunks",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("article_id", sa.Integer(), nullable=False),
        sa.Column("chunk_index", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("chunk_text", sa.Text(), nullable=False),
        sa.Column("article_title", sa.String(length=200), nullable=False, server_default=""),
        sa.Column("embedding", sa.Text(), nullable=False, server_default="[]"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["article_id"], ["knowledge_articles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_article_chunks_article_id", "article_chunks", ["article_id"])

    op.create_table(
        "risk_alerts",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=True),
        sa.Column("risk_level", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("trigger_reason", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("user_message", sa.Text(), nullable=False, server_default=""),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="pending"),
        sa.Column("admin_note", sa.Text(), nullable=False, server_default=""),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["session_id"], ["chat_sessions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_risk_alerts_user_id", "risk_alerts", ["user_id"])
    op.create_index("ix_risk_alerts_session_id", "risk_alerts", ["session_id"])

    op.create_table(
        "agent_prompt_configs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("agent_key", sa.String(length=30), nullable=False),
        sa.Column("agent_name", sa.String(length=50), nullable=False),
        sa.Column("system_prompt", sa.Text(), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("temperature", sa.Float(), nullable=False, server_default="0.7"),
        sa.Column("max_tokens", sa.Integer(), nullable=False, server_default="1024"),
        sa.Column("is_active", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("agent_key"),
    )
    op.create_index("ix_agent_prompt_configs_agent_key", "agent_prompt_configs", ["agent_key"])


def downgrade() -> None:
    op.drop_index("ix_agent_prompt_configs_agent_key", table_name="agent_prompt_configs")
    op.drop_table("agent_prompt_configs")
    op.drop_index("ix_risk_alerts_session_id", table_name="risk_alerts")
    op.drop_index("ix_risk_alerts_user_id", table_name="risk_alerts")
    op.drop_table("risk_alerts")
    op.drop_index("ix_article_chunks_article_id", table_name="article_chunks")
    op.drop_table("article_chunks")
