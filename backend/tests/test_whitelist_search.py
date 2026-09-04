"""白名单联网补充检索单元测试。"""
import asyncio

from app.agents.knowledge import (
    local_retrieval_insufficient,
    merge_citations,
    retrieve_knowledge,
)
from app.services.rag_service import RAGCitation


def test_local_retrieval_insufficient_empty():
    assert local_retrieval_insufficient([]) is True


def test_local_retrieval_insufficient_low_score(monkeypatch):
    monkeypatch.setattr(
        "app.agents.knowledge.settings.WHITELIST_SEARCH_SCORE_THRESHOLD",
        0.5,
    )
    citations = [
        RAGCitation(article_id=1, title="a", snippet="s", score=0.2, source="local"),
    ]
    assert local_retrieval_insufficient(citations) is True


def test_local_retrieval_sufficient(monkeypatch):
    monkeypatch.setattr(
        "app.agents.knowledge.settings.WHITELIST_SEARCH_SCORE_THRESHOLD",
        0.3,
    )
    citations = [
        RAGCitation(article_id=1, title="a", snippet="s", score=0.8, source="local"),
    ]
    assert local_retrieval_insufficient(citations) is False


def test_merge_citations_dedupes_and_limits():
    local = [
        RAGCitation(article_id=1, title="本地", snippet="L", score=0.9, source="local"),
    ]
    web = [
        RAGCitation(
            article_id=0,
            title="网页",
            snippet="W",
            score=0.5,
            url="https://www.who.int/a",
            source="web",
        ),
        RAGCitation(
            article_id=0,
            title="网页重复",
            snippet="W2",
            score=0.4,
            url="https://www.who.int/a",
            source="web",
        ),
    ]
    merged = merge_citations(local, web, limit=5)
    assert len(merged) == 2
    assert merged[0].source == "local"
    assert merged[1].url == "https://www.who.int/a"


def test_retrieve_knowledge_triggers_whitelist_when_local_weak(monkeypatch):
    monkeypatch.setattr(
        "app.agents.knowledge.settings.WHITELIST_SEARCH_ENABLED",
        True,
    )
    monkeypatch.setattr(
        "app.agents.knowledge.settings.WHITELIST_SEARCH_SCORE_THRESHOLD",
        0.9,
    )
    monkeypatch.setattr(
        "app.agents.knowledge.settings.RAG_TOP_K",
        3,
    )
    monkeypatch.setattr(
        "app.agents.knowledge.settings.WHITELIST_SEARCH_TOP_K",
        2,
    )

    async def fake_local_search(self, query, top_k=3):
        return [
            RAGCitation(article_id=1, title="弱匹配", snippet="x", score=0.1, source="local"),
        ]

    async def fake_web_search(self, query):
        return [
            RAGCitation(
                article_id=0,
                title="WHO 焦虑",
                snippet="官方说明",
                score=0.5,
                url="https://www.who.int/zh/anxiety",
                source="web",
            )
        ]

    monkeypatch.setattr(
        "app.services.rag_service.RAGService.search",
        fake_local_search,
    )
    monkeypatch.setattr(
        "app.services.whitelist_search_service.WhitelistSearchService.search",
        fake_web_search,
    )

    class _DummyDB:
        pass

    citations, context = asyncio.run(
        retrieve_knowledge(
            _DummyDB(),  # type: ignore[arg-type]
            "什么是焦虑",
            allow_whitelist_web=True,
        )
    )
    assert any(item.source == "web" for item in citations)
    assert "who.int" in context
    assert "弱匹配" in context


def test_retrieve_knowledge_skips_web_when_not_allowed(monkeypatch):
    called = {"web": False}

    async def fake_local_search(self, query, top_k=3):
        return []

    async def fake_web_search(self, query):
        called["web"] = True
        return []

    monkeypatch.setattr("app.services.rag_service.RAGService.search", fake_local_search)
    monkeypatch.setattr(
        "app.services.whitelist_search_service.WhitelistSearchService.search",
        fake_web_search,
    )

    class _DummyDB:
        pass

    citations, _ = asyncio.run(
        retrieve_knowledge(
            _DummyDB(),  # type: ignore[arg-type]
            "什么是焦虑",
            allow_whitelist_web=False,
        )
    )
    assert citations == []
    assert called["web"] is False


def test_host_allowed_helpers():
    from app.services.whitelist_search_service import _host_allowed

    domains = ["www.who.int", "www.nhc.gov.cn"]
    assert _host_allowed("https://www.who.int/zh/news", domains)
    assert _host_allowed("https://apps.who.int/x", domains)
    assert not _host_allowed("https://evil.example.com", domains)
