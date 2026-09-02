"""Router Agent：意图分类（倾诉 / 咨询 / 危机 / 知识），结合对话轮次。"""
import re

from app.agents.types import IntentType
from app.core.crisis import CRISIS_KEYWORDS
from app.models.chat_session import SENDER_USER
from app.models.message import Message

KNOWLEDGE_PATTERNS = re.compile(
    r"(什么是|什么叫|科普|知识|了解|含义|定义|区别|影响|原因|症状|为什么|怎么回事|有哪些|告诉我|介绍|讲解|说说)"
)
COUNSEL_PATTERNS = re.compile(r"(建议|怎么办|如何|帮助|应该|怎么做|有什么方法|怎样才能|该怎么)")

# 用户已在多轮倾诉具体问题，适合切换到咨询 Agent
PROBLEM_CONTEXT_PATTERN = re.compile(
    r"(工作|面试|求职|找工作|不顺|失败|压力|焦虑|失眠|难过|烦|累|孤独|委屈|抑郁|情绪)"
)

# 心理健康语境：避免离题技术词误判
MENTAL_HEALTH_CONTEXT = re.compile(
    r"(心理|情绪|焦虑|抑郁|失眠|压力|难过|烦|累|孤独|委屈|心情|睡眠|恐惧|恐慌|自责|无助)"
)

# 离题技术/编程类问题（非心理健康范畴）
OFF_TOPIC_PATTERN = re.compile(
    r"(前端|后端|编程|代码|Java|Python|React|Vue|Node|技术栈|算法|数据库|API|框架|CSS|HTML|JavaScript|TypeScript|运维|部署|Docker|Kubernetes)"
)

# 纯倾诉/陪伴类表达，即使有问句也不应走知识 Agent
SHARE_PATTERNS = re.compile(
    r"(聊聊|说说心里话|想找人|好烦|好累|不开心|心情不好|难受|想哭|委屈|孤独|没人理解|倾诉)"
)


def _user_turn_count(history: list[Message] | None) -> int:
    if not history:
        return 0
    return sum(1 for m in history if m.sender_type == SENDER_USER)


def classify_intent(user_message: str, history: list[Message] | None = None) -> IntentType:
    text = user_message.strip()
    if not text:
        return "listen"

    if any(keyword in text for keyword in CRISIS_KEYWORDS):
        return "crisis"

    # 离题技术问题优先识别，避免「前端怎么学」被 counsel 的「怎么」误判
    if OFF_TOPIC_PATTERN.search(text) and not MENTAL_HEALTH_CONTEXT.search(text):
        return "knowledge"

    if SHARE_PATTERNS.search(text):
        return "listen"

    if KNOWLEDGE_PATTERNS.search(text):
        return "knowledge"

    if COUNSEL_PATTERNS.search(text):
        return "counsel"

    turns = _user_turn_count(history)
    # 第 2 轮起：若仍在聊具体困境，切换到咨询 Agent 给可执行支持
    if turns >= 2 and PROBLEM_CONTEXT_PATTERN.search(text):
        return "counsel"

    # 第 3 轮起：持续倾诉时也给一些方向，避免一直空泛倾听
    if turns >= 3:
        return "counsel"

    return "listen"
