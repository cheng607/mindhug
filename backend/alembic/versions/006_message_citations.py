"""messages 表增加 citations 字段"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "006_message_citations"
down_revision: Union[str, None] = "005_sprint7_rag_admin"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("citations", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("messages", "citations")
