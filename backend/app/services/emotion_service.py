"""情绪分析 Pipeline：LLM 结构化输出 + 规则引擎兜底。"""
import json
import logging
import re
import time
from typing import Any

from app.prompts.emotion import (
    EMOTION_ANALYSIS_SYSTEM_PROMPT,
    EMOTION_ANALYSIS_USER_TEMPLATE,
    SESSION_EMOTION_USER_TEMPLATE,
)
from app.schemas.session import EmotionAnalysisResponse
from app.services.llm_service import llm_service

logger = logging.getLogger(__name__)

from app.core.crisis import CRISIS_KEYWORDS
NEGATIVE_WORDS = ("压力", "焦虑", "失眠", "难过", "孤独", "抑郁", "害怕", "崩溃", "疲惫", "绝望")

EMOTION_LABELS = {
    "happy": "开心",
    "calm": "平静",
    "anxious": "焦虑",
    "sad": "悲伤",
    "excited": "兴奋",
    "tired": "疲惫",
    "surprised": "惊讶",
    "confused": "困惑",
}


def _extract_json(text: str) -> dict[str, Any] | None:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            return None
    return None


def _to_emotion_response(data: dict[str, Any]) -> EmotionAnalysisResponse:
    return EmotionAnalysisResponse(
        primaryEmotion=str(data.get("primaryEmotion", "平静")),
        emotionScore=float(data.get("emotionScore", 0.35)),
        isNegative=bool(data.get("isNegative", False)),
        riskLevel=int(data.get("riskLevel", 0)),
        keywords=list(data.get("keywords", [])),
        suggestion=str(data.get("suggestion", "")),
        icon=str(data.get("icon", "😊")),
        label=str(data.get("label", "")),
        riskDescription=str(data.get("riskDescription", "")),
        improvementSuggestions=list(data.get("improvementSuggestions", [])),
        timestamp=int(data.get("timestamp", time.time() * 1000)),
    )


def analyze_session_by_rules(content: str) -> EmotionAnalysisResponse:
    is_crisis = any(keyword in content for keyword in CRISIS_KEYWORDS)
    matched = [word for word in NEGATIVE_WORDS if word in content]

    if is_crisis:
        return EmotionAnalysisResponse(
            primaryEmotion="危机",
            emotionScore=0.95,
            isNegative=True,
            riskLevel=3,
            keywords=matched or ["求助"],
            suggestion="你并不孤单，请立即联系心理援助热线 400-161-9995 或身边可信任的人。",
            icon="🆘",
            label="需要立即关注",
            riskDescription="检测到高风险表达，建议尽快寻求专业帮助",
            improvementSuggestions=[
                "拨打心理援助热线 400-161-9995",
                "联系家人或朋友陪伴",
                "前往最近的心理卫生中心",
            ],
            timestamp=int(time.time() * 1000),
        )

    if matched:
        return EmotionAnalysisResponse(
            primaryEmotion="焦虑",
            emotionScore=0.72,
            isNegative=True,
            riskLevel=2,
            keywords=matched[:3],
            suggestion="建议尝试深呼吸放松，并记录今天发生的三件小事。",
            icon="😟",
            label="轻度焦虑",
            riskDescription="检测到负面情绪，建议关注自身状态",
            improvementSuggestions=["每天散步15分钟", "记录三件好事", "保证规律作息"],
            timestamp=int(time.time() * 1000),
        )

    return EmotionAnalysisResponse(
        primaryEmotion="平静",
        emotionScore=0.35,
        isNegative=False,
        riskLevel=0,
        keywords=["稳定"],
        suggestion="你的状态看起来不错，继续保持自我觉察的习惯。",
        icon="😊",
        label="状态良好",
        riskDescription="当前情绪整体稳定",
        improvementSuggestions=["保持运动习惯", "与朋友分享近况", "继续记录情绪变化"],
        timestamp=int(time.time() * 1000),
    )


def analyze_diary_by_rules(
    content: str,
    dominant_emotion: str,
    mood_score: int,
) -> EmotionAnalysisResponse:
    emotion_label = EMOTION_LABELS.get(dominant_emotion, dominant_emotion)
    is_negative = mood_score <= 5
    risk_level = 0
    if mood_score <= 3:
        risk_level = 2
    elif mood_score <= 5:
        risk_level = 1

    if any(word in content for word in CRISIS_KEYWORDS):
        return analyze_session_by_rules(content)

    return EmotionAnalysisResponse(
        primaryEmotion=emotion_label,
        emotionScore=round(mood_score / 10, 2),
        isNegative=is_negative,
        riskLevel=risk_level,
        keywords=[dominant_emotion, content[:10] or "情绪"],
        suggestion=(
            "建议尝试深呼吸放松，并记录今天发生的三件小事。"
            if is_negative
            else "建议保持规律作息，并尝试与信任的人分享今天的感受。"
        ),
        icon="😟" if is_negative else "😊",
        label=f"{'轻度' if risk_level == 1 else ''}{emotion_label}",
        riskDescription=(
            "检测到负面情绪，建议关注自身状态"
            if is_negative
            else "当前情绪整体稳定"
        ),
        improvementSuggestions=["每天散步15分钟", "记录三件好事", "保证规律作息"],
        timestamp=int(time.time() * 1000),
    )


async def analyze_session_emotion(content: str) -> EmotionAnalysisResponse:
    if not content.strip():
        return analyze_session_by_rules("")

    if llm_service.enabled:
        try:
            messages = [
                {"role": "system", "content": EMOTION_ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": SESSION_EMOTION_USER_TEMPLATE.format(content=content)},
            ]
            raw = await llm_service.chat_complete(messages, temperature=0.3, max_tokens=512)
            parsed = _extract_json(raw)
            if parsed:
                parsed["timestamp"] = int(time.time() * 1000)
                return _to_emotion_response(parsed)
        except Exception as exc:
            logger.warning("LLM 会话情绪分析失败，回退规则引擎: %s", exc)

    return analyze_session_by_rules(content)


async def analyze_diary_emotion(
    content: str,
    dominant_emotion: str,
    mood_score: int,
) -> EmotionAnalysisResponse:
    if llm_service.enabled:
        try:
            user_content = EMOTION_ANALYSIS_USER_TEMPLATE.format(
                content=content,
                dominant_emotion=dominant_emotion,
                mood_score=mood_score,
            )
            messages = [
                {"role": "system", "content": EMOTION_ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
            ]
            raw = await llm_service.chat_complete(messages, temperature=0.3, max_tokens=512)
            parsed = _extract_json(raw)
            if parsed:
                parsed["timestamp"] = int(time.time() * 1000)
                return _to_emotion_response(parsed)
        except Exception as exc:
            logger.warning("LLM 日记情绪分析失败，回退规则引擎: %s", exc)

    return analyze_diary_by_rules(content, dominant_emotion, mood_score)
