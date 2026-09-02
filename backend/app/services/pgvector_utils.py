"""pgvector 工具：PostgreSQL 向量列检测与格式化（SQLite 测试环境自动回退）。"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def is_postgresql(db: Session) -> bool:
    bind = db.get_bind()
    return bind.dialect.name == "postgresql"


def pgvector_column_exists(db: Session) -> bool:
    if not is_postgresql(db):
        return False
    try:
        columns = inspect(db.get_bind()).get_columns("article_chunks")
        return any(col["name"] == "embedding_vec" for col in columns)
    except Exception as exc:
        logger.debug("检测 embedding_vec 列失败: %s", exc)
        return False


def pgvector_search_enabled(db: Session) -> bool:
    return is_postgresql(db) and pgvector_column_exists(db)


def format_vector(vec: list[float]) -> str:
    return "[" + ",".join(str(float(x)) for x in vec) + "]"


def set_chunk_embedding_vec(db: Session, chunk_id: int, embedding: list[float]) -> None:
    vec_str = format_vector(embedding)
    db.execute(
        text("UPDATE article_chunks SET embedding_vec = CAST(:vec AS vector) WHERE id = :id"),
        {"vec": vec_str, "id": chunk_id},
    )
