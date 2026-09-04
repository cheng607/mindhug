"""知识 RAG Agent：检索知识库并生成带引用的回答。"""
import logging

from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.prompt_config_service import PromptConfigService
from app.services.rag_service import RAGCitation, RAGService
from app.services.whitelist_search_service import WhitelistSearchService

logger = logging.getLogger(__name__)

KNOWLEDGE_RAG_USER_TEMPLATE = """用户问题：{query}

以下是从知识库/官方站点检索到的相关内容：
{context}

请基于以上内容回答用户问题。要求：
1. 优先使用检索到的知识库与官方网页内容
2. 回答末尾用「参考来源」列出引用的文章/网页标题
3. 若检索内容不足，可补充通用心理学知识，但需说明
4. 不做诊断，简体中文，200-350 字"""


def local_retrieval_insufficient(citations: list[RAGCitation]) -> bool:
    """本地检索为空，或最高分低于阈值，视为不足。"""
    if not citations:
        return True
    best = max((item.score for item in citations), default=0.0)
    return best < settings.WHITELIST_SEARCH_SCORE_THRESHOLD


def merge_citations(
    local: list[RAGCitation],
    web: list[RAGCitation],
    limit: int,
) -> list[RAGCitation]:
    merged: list[RAGCitation] = []
    seen_keys: set[str] = set()

    for item in local + web:
        key = (item.url or f"local:{item.article_id}:{item.title}").strip().lower()
        if key in seen_keys:
            continue
        seen_keys.add(key)
        merged.append(item)
        if len(merged) >= limit:
            break
    return merged


async def retrieve_knowledge(
    db: Session,
    query: str,
    top_k: int | None = None,
    allow_whitelist_web: bool = False,
) -> tuple[list[RAGCitation], str]:
    """
    本地 RAG 优先；知识意图下若本地不足，再白名单站点搜索并合并引用。
    """
    limit = top_k or settings.RAG_TOP_K
    rag = RAGService(db)
    local = await rag.search(query, top_k=limit)

    web: list[RAGCitation] = []
    if (
        allow_whitelist_web
        and settings.WHITELIST_SEARCH_ENABLED
        and local_retrieval_insufficient(local)
    ):
        logger.info(
            "本地 RAG 不足（count=%s, best=%.3f），触发白名单搜索",
            len(local),
            max((c.score for c in local), default=0.0),
        )
        try:
            web = await WhitelistSearchService().search(query)
        except Exception as exc:
            logger.warning("白名单搜索异常，仅使用本地结果: %s", exc)

    citations = merge_citations(local, web, limit=limit + settings.WHITELIST_SEARCH_TOP_K)
    context = rag.build_context(citations)
    return citations, context


def build_knowledge_messages(
    db: Session,
    history: list,
    query: str,
    context: str,
    max_messages: int | None = None,
) -> list[dict[str, str]]:
    from app.models.chat_session import SENDER_USER

    limit = max_messages or settings.LLM_MAX_CONTEXT_MESSAGES
    prompt_service = PromptConfigService(db)
    system_prompt = prompt_service.get_prompt("knowledge")

    if context:
        system_prompt = (
            f"{system_prompt}\n\n"
            "当前已接入 RAG 知识库与官方站点补充检索。请优先基于提供的参考资料回答，"
            "并在回答末尾标注参考来源（含网页链接标题）。"
        )

    messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    recent = history[-limit:] if len(history) > limit else history
    for msg in recent[:-1]:
        role = "user" if msg.sender_type == SENDER_USER else "assistant"
        messages.append({"role": role, "content": msg.content})

    user_content = KNOWLEDGE_RAG_USER_TEMPLATE.format(query=query, context=context or "（暂无匹配资料）")
    messages.append({"role": "user", "content": user_content})
    return messages


def build_knowledge_mock_reply(query: str, citations: list[RAGCitation]) -> str:
    if citations:
        top = citations[0]
        origin = "官方网页" if top.source == "web" else "知识库"
        body = (
            f"根据{origin}资料，《{top.title}》中提到：{top.snippet}\n\n"
            "心理健康知识能帮助我们更好地理解自己的情绪。"
            "建议结合平台知识库与权威公开资料进一步了解。"
        )
        refs = []
        for item in citations:
            if item.url:
                refs.append(f"- 《{item.title}》 {item.url}")
            else:
                refs.append(f"- 《{item.title}》")
        return f"{body}\n\n**参考来源：**\n" + "\n".join(refs)

    return (
        f"关于「{query[:30]}」，这是心理健康领域的常见问题。\n\n"
        "保持规律作息、适度运动和情绪表达，是维护心理健康的重要方式。"
        "你可以在平台「知识库」中浏览更多科普文章。"
    )
