"""文本向量化：mock 确定性向量 + OpenAI 兼容 Embedding API。"""
import hashlib
import json
import logging
import math
import struct
from typing import Sequence

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def _normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


def mock_embed(text: str, dim: int) -> list[float]:
    """无 API Key 时的确定性伪向量，便于本地测试与演示。"""
    vec: list[float] = []
    for i in range(dim):
        digest = hashlib.md5(f"{text}:{i}".encode()).digest()
        val = struct.unpack("f", digest[:4])[0]
        if not math.isfinite(val):
            val = 0.0
        vec.append(val)
    return _normalize(vec)


class EmbeddingService:
    def __init__(self) -> None:
        self.dim = settings.EMBEDDING_DIM
        self.enabled = settings.embedding_enabled

    async def embed_text(self, text: str) -> list[float]:
        if not text.strip():
            return mock_embed("empty", self.dim)
        if self.enabled:
            try:
                return await self._embed_via_api(text)
            except Exception as exc:
                logger.warning("Embedding API 失败，回退 mock: %s", exc)
        return mock_embed(text, self.dim)

    async def embed_batch(self, texts: Sequence[str]) -> list[list[float]]:
        results: list[list[float]] = []
        for text in texts:
            results.append(await self.embed_text(text))
        return results

    async def _embed_via_api(self, text: str) -> list[float]:
        payload = {
            "model": settings.EMBEDDING_MODEL or "text-embedding-3-small",
            "input": text,
        }
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{settings.embedding_base_url}/embeddings",
                headers={
                    "Authorization": f"Bearer {settings.embedding_api_key}",
                    "Content-Type": "application/json",
                },
                json=payload,
            )
            response.raise_for_status()
            data = response.json()
            vec = [float(x) for x in data["data"][0]["embedding"]]
            if len(vec) != self.dim:
                logger.warning(
                    "Embedding 维度 %s 与配置 EMBEDDING_DIM=%s 不一致，请调整配置并重建索引",
                    len(vec),
                    self.dim,
                )
            return vec


def cosine_similarity(a: list[float], b: list[float]) -> float:
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a)) or 1.0
    norm_b = math.sqrt(sum(x * x for x in b)) or 1.0
    score = dot / (norm_a * norm_b)
    return score if math.isfinite(score) else 0.0


def parse_embedding(raw: str) -> list[float]:
    try:
        data = json.loads(raw)
        if isinstance(data, list):
            return [float(x) for x in data]
    except (json.JSONDecodeError, TypeError, ValueError):
        pass
    return []


embedding_service = EmbeddingService()
