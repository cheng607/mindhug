"""知识 RAG Agent：检索知识库并生成带引用的回答。"""
import logging

from sqlalchemy.orm import Session

from app.agents.prompts import KNOWLEDGE_SYSTEM_PROMPT
from app.services.prompt_config_service import PromptConfigService
from app.services.rag_service import RAGCitation, RAGService

logger = logging.getLogger(__name__)

KNOWLEDGE_RAG_USER_TEMPLATE = """用户问题：{query}

以下是从知识库检索到的相关内容：
{context}

请基于以上内容回答用户问题。要求：
1. 优先使用检索到的知识库内容
2. 回答末尾用「参考来源」列出引用的文章标题
3. 若检索内容不足，可补充通用心理学知识，但需说明
4. 不做诊断，简体中文，200-350 字"""


async def retrieve_knowledge(db: Session, query: str, top_k: int = 3) -> tuple[list[RAGCitation], str]:
    rag = RAGService(db)
    citations = await rag.search(query, top_k=top_k)
    context = rag.build_context(citations)
    return citations, context


def build_knowledge_messages(
    db: Session,
    history: list,
    query: str,
    context: str,
    max_messages: int | None = None,
) -> list[dict[str, str]]:
    from app.core.config import settings
    from app.models.chat_session import SENDER_USER

    limit = max_messages or settings.LLM_MAX_CONTEXT_MESSAGES
    prompt_service = PromptConfigService(db)
    system_prompt = prompt_service.get_prompt("knowledge")

    if context:
        system_prompt = (
            f"{system_prompt}\n\n"
            "当前已接入 RAG 知识库检索。请严格基于提供的参考资料回答，"
            "并在回答末尾标注参考来源。"
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
        body = (
            f"根据知识库资料，《{top.title}》中提到：{top.snippet}\n\n"
            "心理健康知识能帮助我们更好地理解自己的情绪。"
            "建议你在平台「知识库」中阅读更多相关文章。"
        )
        refs = "\n".join(f"- 《{item.title}》" for item in citations)
        return f"{body}\n\n**参考来源：**\n{refs}"

    return (
        f"关于「{query[:30]}」，这是心理健康领域的常见问题。\n\n"
        "保持规律作息、适度运动和情绪表达，是维护心理健康的重要方式。"
        "你可以在平台「知识库」中浏览更多科普文章。"
    )
