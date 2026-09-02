"""Router Agent：意图分类（倾诉 / 咨询 / 危机 / 知识）。"""
import re

from app.agents.types import IntentType
from app.core.crisis import CRISIS_KEYWORDS

KNOWLEDGE_PATTERNS = re.compile(
    r"(什么是|什么叫|科普|知识|了解|含义|定义|区别|影响|原因|症状|为什么|怎么回事|有哪些)"
)
COUNSEL_PATTERNS = re.compile(r"(建议|怎么办|如何|帮助|应该|怎么做|有什么方法)")


def classify_intent(user_message: str) -> IntentType:
    text = user_message.strip()
    if not text:
        return "listen"

    if any(keyword in text for keyword in CRISIS_KEYWORDS):
        return "crisis"

    if KNOWLEDGE_PATTERNS.search(text):
        return "knowledge"

    if COUNSEL_PATTERNS.search(text):
        return "counsel"

    return "listen"
