import json
import logging
import math
from datetime import date, datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.core.database import SessionLocal
from app.models.emotion_diary import AI_STATUS_COMPLETED, AI_STATUS_PENDING, EmotionDiary
from app.models.user import User
from app.schemas.diary import DiaryCreateRequest, DiaryItemResponse, DiaryPageResponse
from app.services.emotion_service import analyze_diary_by_rules, analyze_diary_emotion

logger = logging.getLogger(__name__)

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


def _to_iso(dt: datetime | None) -> str:
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _parse_date(value: str) -> date:
    return date.fromisoformat(value)


def build_diary_item(diary: EmotionDiary, user: User) -> DiaryItemResponse:
    return DiaryItemResponse(
        id=diary.id,
        userId=diary.user_id,
        username=user.username,
        nickname=user.display_name,
        diaryContent=diary.diary_content,
        diaryContentPreview=diary.diary_content_preview,
        contentLength=diary.content_length,
        diaryDate=diary.diary_date.isoformat(),
        dominantEmotion=diary.dominant_emotion,
        emotionTriggers=diary.emotion_triggers,
        moodScore=diary.mood_score,
        sleepQuality=diary.sleep_quality,
        stressLevel=diary.stress_level,
        aiAnalysisStatus=diary.ai_analysis_status,
        aiEmotionAnalysis=diary.ai_emotion_analysis or "{}",
        aiAnalysisUpdatedAt=_to_iso(diary.ai_analysis_updated_at),
        hasAiEmotionAnalysis=diary.has_ai_emotion_analysis,
        createdAt=_to_iso(diary.created_at),
        updatedAt=_to_iso(diary.updated_at),
    )


class DiaryService:
    def __init__(self, db: Session):
        self.db = db

    def create_diary(self, user: User, payload: DiaryCreateRequest) -> EmotionDiary:
        diary = EmotionDiary(
            user_id=user.id,
            diary_content=payload.diaryContent.strip(),
            diary_date=_parse_date(payload.diaryDate),
            dominant_emotion=payload.dominantEmotion,
            emotion_triggers=payload.emotionTriggers or "",
            mood_score=payload.moodScore,
            sleep_quality=payload.sleepQuality,
            stress_level=payload.stressLevel,
            ai_analysis_status=AI_STATUS_PENDING,
        )
        self.db.add(diary)
        self.db.commit()
        self.db.refresh(diary)
        return diary

    async def analyze_diary(self, diary_id: int) -> None:
        """异步 AI 情绪分析任务（使用当前 db session）。"""
        diary = self.db.query(EmotionDiary).filter(EmotionDiary.id == diary_id).first()
        if not diary:
            logger.warning("日记 %s 不存在，跳过分析", diary_id)
            return

        combined = f"{diary.diary_content} {diary.emotion_triggers}"
        try:
            result = await analyze_diary_emotion(
                combined,
                diary.dominant_emotion,
                diary.mood_score,
            )
        except Exception as exc:
            logger.error("日记 %s AI 分析失败，使用规则兜底: %s", diary_id, exc)
            result = analyze_diary_by_rules(
                combined,
                diary.dominant_emotion,
                diary.mood_score,
            )

        now = datetime.now(timezone.utc)
        diary.ai_analysis_status = AI_STATUS_COMPLETED
        diary.ai_emotion_analysis = json.dumps(result.model_dump(), ensure_ascii=False)
        diary.ai_analysis_updated_at = now
        self.db.commit()

    def list_admin_diaries(
        self,
        page_num: int = 1,
        page_size: int = 10,
        user_id: str | None = None,
        dominant_emotion: str | None = None,
        min_mood_score: int | None = None,
        max_mood_score: int | None = None,
    ) -> DiaryPageResponse:
        query = (
            self.db.query(EmotionDiary)
            .options(joinedload(EmotionDiary.user))
            .join(User, EmotionDiary.user_id == User.id)
        )

        if user_id:
            try:
                query = query.filter(EmotionDiary.user_id == int(user_id))
            except ValueError:
                pass
        if dominant_emotion:
            query = query.filter(EmotionDiary.dominant_emotion == dominant_emotion)
        if min_mood_score is not None:
            query = query.filter(EmotionDiary.mood_score >= min_mood_score)
        if max_mood_score is not None:
            query = query.filter(EmotionDiary.mood_score <= max_mood_score)

        total = query.count()
        pages = max(math.ceil(total / page_size), 1) if page_size else 1
        current = min(max(page_num, 1), pages) if total else 1
        offset = (current - 1) * page_size

        diaries = (
            query.order_by(desc(EmotionDiary.diary_date), desc(EmotionDiary.id))
            .offset(offset)
            .limit(page_size)
            .all()
        )

        records = [build_diary_item(item, item.user) for item in diaries]
        return DiaryPageResponse(
            records=records,
            total=total,
            size=page_size,
            current=current,
            pages=pages,
        )

    def delete_diary(self, diary_id: int) -> None:
        diary = self.db.query(EmotionDiary).filter(EmotionDiary.id == diary_id).first()
        if not diary:
            raise ValueError("日记不存在")
        self.db.delete(diary)
        self.db.commit()


async def run_diary_analysis_task(diary_id: int) -> None:
    db = SessionLocal()
    try:
        service = DiaryService(db)
        await service.analyze_diary(diary_id)
    finally:
        db.close()
