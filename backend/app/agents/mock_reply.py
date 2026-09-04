"""Mock 模式回复生成：结合对话上下文，减少模板感。"""
import re

from app.agents.knowledge import build_knowledge_mock_reply
from app.agents.types import IntentType
from app.core.crisis import CRISIS_KEYWORDS, CRISIS_RESPONSE_TEMPLATE
from app.models.chat_session import SENDER_AI, SENDER_USER
from app.models.message import Message
from app.services.rag_service import RAGCitation

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
    ("难过", "难过"),
    ("悲伤", "难过"),
    ("孤独", "孤独"),
    ("烦", "烦躁"),
    ("不顺", "挫折"),
    ("委屈", "委屈"),
]

THEME_OPENINGS: dict[str, list[str]] = {
    "烦躁": [
        "听起来最近心里挺堵的。烦躁这种感受很消耗人——是某件具体的事，还是说不清的原因？",
        "能感觉到你现在不太舒服。这种「烦」往往背后有原因，你愿意说说最近发生了什么吗？",
    ],
    "工作": [
        "工作上的不顺确实让人沮丧，那种「怎么努力都不对劲」的感觉很磨人。最近是发生了什么具体的事？",
        "工作这块儿卡住了，心里肯定不好受。是任务、人际关系，还是别的什么在困扰你？",
    ],
    "疲惫": [
        "听起来你最近挺累的，身体和情绪可能都在透支。这种疲惫持续多久了？",
        "累的时候连说话都觉得费力，我懂。最近是休息不够，还是心里的事太多？",
    ],
    "压力": [
        "压力堆久了确实会让人喘不过气。你现在最压在心上的，是哪一块？",
        "能感觉到你承受了不少。如果只说一件最近最让你焦虑的事，会是什么？",
    ],
    "default": [
        "愿意把这些说出来，本身就需要勇气。你现在最在意的，是什么？",
        "我在这儿听着。你可以慢慢说，不用组织得很完美。",
    ],
}

RAG_SUPPLEMENT_PATTERN = re.compile(
    r"(怎么办|如何|影响|原因|症状|缓解|改善|压力|焦虑|失眠|抑郁|情绪|睡不着|疲惫|累)"
)

OFF_TOPIC_PATTERN = re.compile(
    r"(前端|后端|编程|代码|Java|Python|React|Vue|Node|技术栈|算法|数据库|API|框架|CSS|HTML|JavaScript|TypeScript)"
)

OFF_TOPIC_RESPONSE = (
    "我是心理健康助手「小暖」，主要提供**情绪倾听**和**心理学知识**科普。\n\n"
    "关于「{snippet}」这类专业问题，我可能无法给出准确解答。"
    "如果你在学习和工作中因此感到压力或困惑，我很愿意陪你聊聊。"
)


def should_supplement_rag(intent: IntentType, user_message: str) -> bool:
    if intent in ("listen", "counsel"):
        return bool(RAG_SUPPLEMENT_PATTERN.search(user_message))
    return False


def _extract_themes(text: str) -> list[str]:
    found: list[str] = []
    for keyword, label in THEME_HINTS:
        if keyword in text and label not in found:
            found.append(label)
    return found


def _user_messages(history: list[Message], current: str, limit: int = 6) -> list[str]:
    prior = [m.content.strip() for m in history if m.sender_type == SENDER_USER and m.content]
    return (prior + [current.strip()])[-limit:]


def _accumulated_themes(messages: list[str]) -> list[str]:
    themes: list[str] = []
    for msg in messages:
        for theme in _extract_themes(msg):
            if theme not in themes:
                themes.append(theme)
    return themes


def _user_turn_count(history: list[Message]) -> int:
    return sum(1 for m in history if m.sender_type == SENDER_USER)


def _snippet(text: str, max_len: int = 20) -> str:
    cleaned = re.sub(r"\s+", "", text.strip())
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[:max_len] + "…"


def _pick_variant(options: list[str], seed: int) -> str:
    return options[seed % len(options)]


def _append_citation_block(body: str, citations: list[RAGCitation] | None) -> str:
    if not citations:
        return body
    refs = []
    for item in citations[:3]:
        if item.url:
            refs.append(f"- 《{item.title}》 {item.url}")
        else:
            refs.append(f"- 《{item.title}》")
    return f"{body}\n\n**参考来源：**\n" + "\n".join(refs)


def _build_contextual_follow_up(
    prior_messages: list[str],
    current: str,
    all_themes: list[str],
) -> str:
    """多轮对话：串联前文，避免「这些叠加在一起」等空话。"""
    current_themes = _extract_themes(current)
    new_themes = [t for t in current_themes if t not in _accumulated_themes(prior_messages[:-1])]

    if len(prior_messages) >= 2 and all_themes:
        earlier = prior_messages[-2]
        earlier_short = _snippet(earlier, 16)
        current_short = _snippet(current, 16)

        if len(all_themes) >= 2:
            t1, t2 = all_themes[0], all_themes[-1]
            if t1 != t2:
                return (
                    f"你前面提到{earlier_short}，现在又说{current_short}——"
                    f"从**{t1}**到**{t2}**，这两块是不是连在一起的？"
                    f"如果愿意，可以具体说说工作上最让你难受的那一点。"
                )

        if new_themes:
            theme = new_themes[0]
            return (
                f"嗯，{current_short}。结合你刚才说的{earlier_short}，"
                f"听起来**{theme}**这件事确实在影响你的状态。"
                f"能再具体一点吗——是发生了什么，还是一直积累到现在？"
            )

        return (
            f"我在听。你刚才说{earlier_short}，现在补充了{current_short}。"
            f"这两件事在你心里，哪个分量更重一些？"
        )

    if current_themes:
        theme = current_themes[0]
        return _pick_variant(THEME_OPENINGS.get(theme, THEME_OPENINGS["default"]), len(current))

    return _pick_variant(THEME_OPENINGS["default"], len(current))


def build_listen_mock(user_message: str, history: list[Message]) -> str:
    turn = _user_turn_count(history)
    user_msgs = _user_messages(history, user_message)
    all_themes = _accumulated_themes(user_msgs)

    if turn == 0:
        themes = _extract_themes(user_message)
        if themes:
            return _pick_variant(THEME_OPENINGS.get(themes[0], THEME_OPENINGS["default"]), len(user_message))
        return _pick_variant(THEME_OPENINGS["default"], len(user_message))

    return _build_contextual_follow_up(user_msgs, user_message, all_themes)


def build_counsel_mock(user_message: str, citations: list[RAGCitation] | None = None) -> str:
    themes = _extract_themes(user_message)
    theme_hint = f"关于{themes[0]}，" if themes else ""

    body = (
        f"{theme_hint}在给你建议之前，我想先了解："
        f"你现在最想改变的具体状况是什么？\n\n"
        "常见的小步骤包括：每天 5 分钟腹式呼吸、写下三件小事、出门散步 15 分钟。"
        "你觉得哪个现在最容易开始？"
    )
    return _append_citation_block(body, citations)


def _is_off_topic(text: str) -> bool:
    return bool(OFF_TOPIC_PATTERN.search(text))


def build_mock_reply(
    user_message: str,
    intent: IntentType,
    citations: list[RAGCitation] | None = None,
    history: list[Message] | None = None,
) -> str:
    history = history or []

    if _is_off_topic(user_message) and intent in ("listen", "counsel", "knowledge"):
        return OFF_TOPIC_RESPONSE.format(snippet=_snippet(user_message))

    if intent == "crisis" or any(kw in user_message for kw in CRISIS_KEYWORDS):
        return CRISIS_RESPONSE_TEMPLATE
    if intent == "knowledge":
        return build_knowledge_mock_reply(user_message, citations or [])
    if intent == "counsel":
        return build_counsel_mock(user_message, citations)
    return _append_citation_block(build_listen_mock(user_message, history), citations)
