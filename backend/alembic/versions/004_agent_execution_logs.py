"""agent_execution_logs 表"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "004_agent_execution_logs"
down_revision: Union[str, None] = "003_sprint3_business_modules"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "agent_execution_logs",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("user_message", sa.Text(), nullable=False),
        sa.Column("intent", sa.String(length=20), nullable=False),
        sa.Column("active_agent", sa.String(length=50), nullable=False),
        sa.Column("latency_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("llm_used", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["session_id"], ["chat_sessions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_execution_logs_session_id", "agent_execution_logs", ["session_id"])
    op.create_index("ix_agent_execution_logs_user_id", "agent_execution_logs", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_agent_execution_logs_user_id", table_name="agent_execution_logs")
    op.drop_index("ix_agent_execution_logs_session_id", table_name="agent_execution_logs")
    op.drop_table("agent_execution_logs")
