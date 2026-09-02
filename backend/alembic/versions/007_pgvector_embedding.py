"""article_chunks 增加 pgvector 向量列（仅 PostgreSQL）"""
from typing import Sequence, Union

from alembic import op

revision: str = "007_pgvector_embedding"
down_revision: Union[str, None] = "006_message_citations"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute(
        "ALTER TABLE article_chunks ADD COLUMN IF NOT EXISTS embedding_vec vector(384)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_article_chunks_embedding_vec "
        "ON article_chunks USING ivfflat (embedding_vec vector_cosine_ops) WITH (lists = 100)"
    )


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    op.execute("DROP INDEX IF EXISTS ix_article_chunks_embedding_vec")
    op.execute("ALTER TABLE article_chunks DROP COLUMN IF EXISTS embedding_vec")
