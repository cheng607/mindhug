"""知识库 RAG：文章分块、向量化、相似度检索。"""
import json
import logging
import math
import re
from dataclasses import dataclass

from sqlalchemy.orm import Session

from app.models.article_chunk import ArticleChunk
from app.models.knowledge_article import STATUS_PUBLISHED, KnowledgeArticle
from app.services.embedding_service import cosine_similarity, embedding_service, parse_embedding
from app.services.pgvector_utils import pgvector_search_enabled, set_chunk_embedding_vec

logger = logging.getLogger(__name__)

CHUNK_SIZE = 400
CHUNK_OVERLAP = 80


@dataclass
class RAGCitation:
    article_id: int
    title: str
    snippet: str
    score: float

    def to_dict(self) -> dict:
        score = self.score if math.isfinite(self.score) else 0.0
        return {
            "articleId": str(self.article_id),
            "title": self.title,
            "snippet": self.snippet,
            "score": round(score, 4),
        }


def strip_html(text: str) -> str:
    cleaned = re.sub(r"<[^>]+>", " ", text or "")
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


def split_text(text: str, chunk_size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    plain = strip_html(text)
    if not plain:
        return []
    if len(plain) <= chunk_size:
        return [plain]

    chunks: list[str] = []
    start = 0
    while start < len(plain):
        end = min(start + chunk_size, len(plain))
        chunk = plain[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end >= len(plain):
            break
        start = max(end - overlap, start + 1)
    return chunks


class RAGService:
    def __init__(self, db: Session):
        self.db = db

    async def index_article(self, article: KnowledgeArticle) -> int:
        self.db.query(ArticleChunk).filter(ArticleChunk.article_id == article.id).delete()
        chunks = split_text(article.content or article.summary or article.title)
        if not chunks:
            chunks = [article.title]

        texts = [f"{article.title}\n{chunk}" for chunk in chunks]
        embeddings = await embedding_service.embed_batch(texts)

        for index, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            row = ArticleChunk(
                article_id=article.id,
                chunk_index=index,
                chunk_text=chunk,
                article_title=article.title,
                embedding=json.dumps(embedding),
            )
            self.db.add(row)
            if pgvector_search_enabled(self.db):
                self.db.flush()
                set_chunk_embedding_vec(self.db, row.id, embedding)
        self.db.commit()
        return len(chunks)

    async def index_all_published(self) -> int:
        articles = (
            self.db.query(KnowledgeArticle)
            .filter(KnowledgeArticle.status == STATUS_PUBLISHED)
            .all()
        )
        total = 0
        for article in articles:
            total += await self.index_article(article)
        return total

    async def search(self, query: str, top_k: int = 3) -> list[RAGCitation]:
        if pgvector_search_enabled(self.db):
            try:
                results = await self._search_pgvector(query, top_k)
                if results:
                    return results
            except Exception as exc:
                logger.warning("pgvector 检索失败，回退内存检索: %s", exc)
        return await self._search_memory(query, top_k)

    async def _search_pgvector(self, query: str, top_k: int) -> list[RAGCitation]:
        from sqlalchemy import text

        query_vec = await embedding_service.embed_text(query)
        vec_str = "[" + ",".join(str(float(x)) for x in query_vec) + "]"
        rows = self.db.execute(
            text(
                """
                SELECT ac.article_id, ac.article_title, ac.chunk_text,
                       1 - (ac.embedding_vec <=> CAST(:qvec AS vector)) AS score
                FROM article_chunks ac
                INNER JOIN knowledge_articles ka ON ka.id = ac.article_id
                WHERE ka.status = :published AND ac.embedding_vec IS NOT NULL
                ORDER BY ac.embedding_vec <=> CAST(:qvec AS vector)
                LIMIT :top_k
                """
            ),
            {"qvec": vec_str, "published": STATUS_PUBLISHED, "top_k": top_k},
        ).fetchall()

        results: list[RAGCitation] = []
        for row in rows:
            snippet = row.chunk_text[:120] + ("..." if len(row.chunk_text) > 120 else "")
            results.append(
                RAGCitation(
                    article_id=row.article_id,
                    title=row.article_title,
                    snippet=snippet,
                    score=float(row.score),
                )
            )
        return results

    async def _search_memory(self, query: str, top_k: int) -> list[RAGCitation]:
        query_vec = await embedding_service.embed_text(query)
        chunks = (
            self.db.query(ArticleChunk)
            .join(KnowledgeArticle, KnowledgeArticle.id == ArticleChunk.article_id)
            .filter(KnowledgeArticle.status == STATUS_PUBLISHED)
            .all()
        )
        if not chunks:
            return []

        scored: list[tuple[float, ArticleChunk]] = []
        for chunk in chunks:
            vec = parse_embedding(chunk.embedding)
            if not vec:
                continue
            score = cosine_similarity(query_vec, vec)
            scored.append((score, chunk))

        scored.sort(key=lambda item: item[0], reverse=True)
        results: list[RAGCitation] = []
        for score, chunk in scored[:top_k]:
            snippet = chunk.chunk_text[:120] + ("..." if len(chunk.chunk_text) > 120 else "")
            results.append(
                RAGCitation(
                    article_id=chunk.article_id,
                    title=chunk.article_title,
                    snippet=snippet,
                    score=score,
                )
            )
        return results

    def build_context(self, citations: list[RAGCitation]) -> str:
        if not citations:
            return ""
        parts = []
        for index, item in enumerate(citations, start=1):
            parts.append(f"[{index}] 《{item.title}》：{item.snippet}")
        return "\n".join(parts)
