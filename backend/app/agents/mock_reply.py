"""Mock 模式回复生成：引用用户关键词、避免连续相同模板、支持 RAG 引用。"""
import re

from app.agents.knowledge import build_knowledge_mock_reply
from app.agents.types import IntentType
from app.core.crisis import CRISIS_KEYWORDS, CRISIS_RESPONSE_TEMPLATE
from app.models.chat_session import SENDER_AI
from app.models.message import Message
from app.services.rag_service import RAGCitation
from app.services.session_service import MOCK_AI_RESPONSE

LISTENER_OPENING = (
    "我能感受到你现在的不容易。愿意把这些感受说出来，本身就是很重要的一步。\n\n"
    "你可以先试着做几次深呼吸，把注意力慢慢带回当下。"
    "如果愿意，也可以告诉我：最近最让你困扰的具体事情是什么？"
)

THEME_HINTS: list[tuple[str, str]] = [
    ("累", "疲惫"),
    ("疲惫", "疲惫"),
    ("困", "睡眠"),
    ("失眠", "睡眠"),
    ("下雨", "天气"),
    ("天气", "天气"),
    ("工作", "工作"),
    ("压力", "压力"),
    ("焦虑", "焦虑"),
    ("难过", "情绪低落"),
    ("悲伤", "情绪低落"),
    ("孤独", "孤独感"),
    ("烦", "烦躁"),
]

RAG_SUPPLEMENT_PATTERN = re.compile(
    r"(怎么办|如何|影响|原因|症状|缓解|改善|压力|焦虑|失眠|抑郁|情绪|睡不着|疲惫|累)"
)


def should_supplement_rag(intent: IntentType, user_message: str) -> bool:
    """listen / counsel 意图下，若消息含心理相关词则补充 RAG 检索。"""
    if intent in ("listen", "counsel"):
        return bool(RAG_SUPPLEMENT_PATTERN.search(user_message))
    return False


def _extract_themes(text: str) -> list[str]:
    found: list[str] = []
    for keyword, label in THEME_HINTS:
        if keyword in text and label not in found:
            found.append(label)
    return found


def _last_assistant_content(history: list[Message]) -> str:
    for msg in reversed(history):
        if msg.sender_type == SENDER_AI:
            return msg.content or ""
    return ""


def _is_repeat_opening(history: list[Message]) -> bool:
    last = _last_assistant_content(history)
    return "最近最让你困扰的具体事情" in last or last.strip() == LISTENER_OPENING.strip()


def _snippet(text: str, max_len: int = 24) -> str:
    cleaned = re.sub(r"\s+", "", text.strip())
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[:max_len] + "…"


def _append_citation_block(body: str, citations: list[RAGCitation] | None) -> str:
    if not citations:
        return body
    refs = "\n".join(f"- 《{item.title}》" for item in citations[:3])
    return f"{body}\n\n**参考来源：**\n{refs}"


def build_listen_mock(user_message: str, history: list[Message]) -> str:
    themes = _extract_themes(user_message)
    snippet = _snippet(user_message)

    if _is_repeat_opening(history):
        if themes:
            theme_text = "、".join(themes)
            body = (
                f"谢谢你愿意多说一些。我听到你提到了与**{theme_text}**有关的事"
                f"（「{snippet}」），这些叠加在一起，确实容易让人身心俱疲。\n\n"
                "在这种时候，可以先允许自己「暂时不好受」，不必强行积极。"
                "如果愿意，我们可以一起看看：最近哪一件事对你的影响最大？"
            )
        else:
            body = (
                f"谢谢你继续分享。关于你说的「{snippet}」，"
                "我能感受到这对你来说并不容易。\n\n"
                "我们可以慢慢梳理：这件事里，最让你感到无力或委屈的部分是什么？"
            )
        return body

    if themes:
        theme_text = "、".join(themes)
        body = (
            f"我听到你提到了**{theme_text}**相关的感受（「{snippet}」）。"
            "愿意把这些说出来，本身就是很重要的一步。\n\n"
            "你可以先试着做几次深呼吸，把注意力慢慢带回当下。"
            "如果愿意，也可以告诉我：最近最让你困扰的具体事情是什么？"
        )
        return body

    return LISTENER_OPENING


def build_counsel_mock(user_message: str, citations: list[RAGCitation] | None = None) -> str:
    snippet = _snippet(user_message, 20)
    if re.search(r"(建议|怎么办|如何|帮助)", user_message):
        body = (
            f"关于「{snippet}」，我想先确认一下："
            "这件事里，最让你感到压力的部分是什么？\n\n"
            f"{MOCK_AI_RESPONSE}"
        )
    else:
        body = (
            f"关于「{snippet}」，我理解你希望获得一些具体的建议。"
            "以下是几个可以尝试的小步骤：\n\n"
            "1. **深呼吸**：每天花 5 分钟做腹式呼吸\n"
            "2. **记录**：写下今天发生的三件小事\n"
            "3. **运动**：每天散步 15 分钟\n\n"
            "你觉得哪个最适合现在的你？"
        )
    return _append_citation_block(body, citations)


def build_mock_reply(
    user_message: str,
    intent: IntentType,
    citations: list[RAGCitation] | None = None,
    history: list[Message] | None = None,
) -> str:
    history = history or []

    if intent == "crisis" or any(kw in user_message for kw in CRISIS_KEYWORDS):
        return CRISIS_RESPONSE_TEMPLATE
    if intent == "knowledge":
        return build_knowledge_mock_reply(user_message, citations or [])
    if intent == "counsel":
        return build_counsel_mock(user_message, citations)
    return _append_citation_block(build_listen_mock(user_message, history), citations)
