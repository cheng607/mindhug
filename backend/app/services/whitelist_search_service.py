"""白名单站点搜索：本地 RAG 不足时，仅在官方域名内补充检索。"""
from __future__ import annotations

import logging
import re
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.services.rag_service import RAGCitation

logger = logging.getLogger(__name__)


def _normalize_host(url_or_host: str) -> str:
    value = url_or_host.strip().lower()
    if "://" in value:
        value = urlparse(value).netloc or value
    return value.removeprefix("www.")


def _host_allowed(url: str, allowed_hosts: list[str]) -> bool:
    host = _normalize_host(url)
    if not host:
        return False
    allowed = {_normalize_host(item) for item in allowed_hosts}
    return any(host == item or host.endswith(f".{item}") for item in allowed)


def _strip_html(text: str) -> str:
    cleaned = re.sub(r"(?is)<script.*?>.*?</script>", " ", text or "")
    cleaned = re.sub(r"(?is)<style.*?>.*?</style>", " ", cleaned)
    cleaned = re.sub(r"<[^>]+>", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    return cleaned


class WhitelistSearchService:
    """在配置的官方域名内搜索，返回可并入 RAG 的引用。"""

    def __init__(
        self,
        domains: list[str] | None = None,
        top_k: int | None = None,
        timeout: float | None = None,
    ) -> None:
        self.domains = domains or settings.whitelist_search_domains
        self.top_k = top_k if top_k is not None else settings.WHITELIST_SEARCH_TOP_K
        self.timeout = timeout if timeout is not None else settings.WHITELIST_SEARCH_TIMEOUT

    async def search(self, query: str) -> list[RAGCitation]:
        if not settings.WHITELIST_SEARCH_ENABLED:
            return []
        if not self.domains or not query.strip():
            return []

        results: list[RAGCitation] = []
        seen_urls: set[str] = set()

        for domain in self.domains:
            if len(results) >= self.top_k:
                break
            try:
                hits = await self._search_domain(query, domain, limit=max(1, self.top_k - len(results)))
            except Exception as exc:
                logger.warning("白名单搜索失败 domain=%s: %s", domain, exc)
                continue

            for hit in hits:
                url = (hit.get("href") or hit.get("url") or "").strip()
                if not url or url in seen_urls:
                    continue
                if not _host_allowed(url, self.domains):
                    continue
                seen_urls.add(url)
                title = (hit.get("title") or url).strip()
                snippet = (hit.get("body") or hit.get("snippet") or "").strip()
                if len(snippet) < 40:
                    fetched = await self._fetch_snippet(url)
                    if fetched:
                        snippet = fetched
                if not snippet:
                    snippet = title
                snippet = snippet[:200] + ("..." if len(snippet) > 200 else "")
                results.append(
                    RAGCitation(
                        article_id=0,
                        title=title[:120],
                        snippet=snippet,
                        score=0.5,
                        url=url,
                        source="web",
                    )
                )
                if len(results) >= self.top_k:
                    break

        return results

    async def _search_domain(self, query: str, domain: str, limit: int) -> list[dict]:
        q = f"site:{domain} {query}"
        # 优先官方 duckduckgo_search 包；不可用则回退 HTML 解析
        try:
            return await self._search_via_ddgs(q, limit)
        except Exception as exc:
            logger.debug("ddgs 不可用，回退 HTML 搜索: %s", exc)
            return await self._search_via_html(q, limit)

    async def _search_via_ddgs(self, query: str, limit: int) -> list[dict]:
        try:
            from duckduckgo_search import DDGS
        except ImportError as exc:
            raise RuntimeError("duckduckgo_search not installed") from exc

        def _run() -> list[dict]:
            with DDGS() as ddgs:
                return list(ddgs.text(query, max_results=limit))

        # DDGS 为同步库，放到线程避免阻塞事件循环
        import asyncio

        return await asyncio.to_thread(_run)

    async def _search_via_html(self, query: str, limit: int) -> list[dict]:
        from urllib.parse import quote_plus

        url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (compatible; MindHugBot/1.0; +https://github.com/mindhug)"
            )
        }
        async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
            resp = await client.post(url, headers=headers, data={"q": query})
            resp.raise_for_status()
            html = resp.text

        # 简易解析结果块
        pattern = re.compile(
            r'class="result__a"[^>]*href="(?P<href>[^"]+)"[^>]*>(?P<title>.*?)</a>'
            r'.*?class="result__snippet"[^>]*>(?P<body>.*?)</(?:a|td|div)',
            re.I | re.S,
        )
        hits: list[dict] = []
        for match in pattern.finditer(html):
            href = match.group("href")
            # DuckDuckGo 可能包一层 redirect
            if "uddg=" in href:
                from urllib.parse import parse_qs, unquote, urlparse

                qs = parse_qs(urlparse(href).query)
                href = unquote(qs.get("uddg", [href])[0])
            title = _strip_html(match.group("title"))
            body = _strip_html(match.group("body"))
            hits.append({"href": href, "title": title, "body": body})
            if len(hits) >= limit:
                break
        return hits

    async def _fetch_snippet(self, url: str) -> str:
        try:
            headers = {"User-Agent": "Mozilla/5.0 (compatible; MindHugBot/1.0)"}
            async with httpx.AsyncClient(timeout=self.timeout, follow_redirects=True) as client:
                resp = await client.get(url, headers=headers)
                resp.raise_for_status()
                text = _strip_html(resp.text)
                return text[:240]
        except Exception as exc:
            logger.debug("抓取白名单页面失败 %s: %s", url, exc)
            return ""


whitelist_search_service = WhitelistSearchService()
