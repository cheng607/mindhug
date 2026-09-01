from collections import Counter, defaultdict
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import distinct, func
from sqlalchemy.orm import Session

from app.models.chat_session import ChatSession
from app.models.emotion_diary import EmotionDiary
from app.models.user import User
from app.schemas.analytics import (
    AnalyticsOverviewResponse,
    ConsultationStats,
    DailyTrendItem,
    EmotionHeatmap,
    EmotionTrendItem,
    GridDataItem,
    SystemOverview,
    UserActivityItem,
)

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


def _today() -> date:
    return datetime.now(timezone.utc).date()


def _date_range(days: int) -> list[date]:
    end = _today()
    return [end - timedelta(days=offset) for offset in range(days - 1, -1, -1)]


class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db

    def get_overview(self) -> AnalyticsOverviewResponse:
        today = _today()
        days = 7
        date_list = _date_range(days)

        total_users = self.db.query(func.count(User.id)).scalar() or 0
        total_diaries = self.db.query(func.count(EmotionDiary.id)).scalar() or 0
        total_sessions = self.db.query(func.count(ChatSession.id)).scalar() or 0

        today_new_users = (
            self.db.query(func.count(User.id))
            .filter(func.date(User.created_at) == today)
            .scalar()
            or 0
        )
        today_new_diaries = (
            self.db.query(func.count(EmotionDiary.id))
            .filter(EmotionDiary.diary_date == today)
            .scalar()
            or 0
        )
        today_new_sessions = (
            self.db.query(func.count(ChatSession.id))
            .filter(func.date(ChatSession.started_at) == today)
            .scalar()
            or 0
        )

        avg_mood = (
            self.db.query(func.avg(EmotionDiary.mood_score)).scalar() or 0
        )

        active_window = today - timedelta(days=6)
        active_users = (
            self.db.query(func.count(distinct(EmotionDiary.user_id)))
            .filter(EmotionDiary.diary_date >= active_window)
            .scalar()
            or 0
        )

        system_overview = SystemOverview(
            totalUsers=total_users,
            activeUsers=active_users,
            totalDiaries=total_diaries,
            totalSessions=total_sessions,
            todayNewUsers=today_new_users,
            todayNewDiaries=today_new_diaries,
            todayNewSessions=today_new_sessions,
            avgMoodScore=round(float(avg_mood), 1),
        )

        session_daily = defaultdict(lambda: {"sessionCount": 0, "userIds": set()})
        sessions = (
            self.db.query(ChatSession)
            .filter(func.date(ChatSession.started_at) >= active_window)
            .all()
        )
        total_duration = 0
        for session in sessions:
            day = session.started_at.date() if session.started_at else today
            session_daily[day]["sessionCount"] += 1
            session_daily[day]["userIds"].add(session.user_id)
            total_duration += session.duration_minutes

        daily_trend = [
            DailyTrendItem(
                date=day.isoformat(),
                sessionCount=session_daily[day]["sessionCount"],
                userCount=len(session_daily[day]["userIds"]),
            )
            for day in date_list
        ]

        consultation_stats = ConsultationStats(
            totalSessions=total_sessions,
            avgDurationMinutes=round(total_duration / total_sessions) if total_sessions else 0,
            dailyTrend=daily_trend,
        )

        diary_by_date: dict[date, list[EmotionDiary]] = defaultdict(list)
        diaries = (
            self.db.query(EmotionDiary)
            .filter(EmotionDiary.diary_date >= active_window)
            .all()
        )
        for diary in diaries:
            diary_by_date[diary.diary_date].append(diary)

        emotion_trend = []
        grid_data: list[GridDataItem] = []
        emotion_counter: Counter[str] = Counter()

        for index, day in enumerate(date_list):
            day_diaries = diary_by_date.get(day, [])
            if day_diaries:
                avg_score = sum(item.mood_score for item in day_diaries) / len(day_diaries)
                dominant = Counter(item.dominant_emotion for item in day_diaries).most_common(1)[0][0]
                negative = len([item for item in day_diaries if item.mood_score <= 5])
                positive = len(day_diaries) - negative
                record_count = len(day_diaries)
            else:
                avg_score = 0.0
                dominant = "calm"
                negative = 0
                positive = 0
                record_count = 0

            dominant_label = EMOTION_LABELS.get(dominant, dominant)
            emotion_counter[dominant_label] += record_count

            emotion_trend.append(
                EmotionTrendItem(
                    date=day.isoformat(),
                    avgMoodScore=round(avg_score, 1),
                    dominantEmotion=dominant_label,
                    negativeRatio=round(negative / record_count, 2) if record_count else 0,
                    positiveRatio=round(positive / record_count, 2) if record_count else 0,
                    recordCount=record_count,
                )
            )
            grid_data.append(
                GridDataItem(
                    x=index,
                    y=record_count,
                    value=record_count,
                    avgMoodScore=round(avg_score, 1),
                    dominantEmotion=dominant_label,
                )
            )

        peak_emotion = emotion_counter.most_common(1)[0][0] if emotion_counter else "平静"

        emotion_heatmap = EmotionHeatmap(
            dateRange=f"{date_list[0].isoformat()} ~ {date_list[-1].isoformat()}",
            emotionDistribution=[],
            gridData=grid_data,
            peakEmotionTime=peak_emotion,
        )

        user_activity = []
        for day in date_list:
            new_users = (
                self.db.query(func.count(User.id))
                .filter(func.date(User.created_at) == day)
                .scalar()
                or 0
            )
            diary_user_ids = {
                row[0]
                for row in self.db.query(EmotionDiary.user_id)
                .filter(EmotionDiary.diary_date == day)
                .all()
            }
            session_user_ids = {
                row[0]
                for row in self.db.query(ChatSession.user_id)
                .filter(func.date(ChatSession.started_at) == day)
                .all()
            }
            active_day_users = len(diary_user_ids | session_user_ids)
            user_activity.append(
                UserActivityItem(
                    date=day.isoformat(),
                    activeUsers=active_day_users,
                    newUsers=new_users,
                    diaryUsers=len(diary_user_ids),
                    consultationUsers=len(session_user_ids),
                )
            )

        return AnalyticsOverviewResponse(
            consultationStats=consultation_stats,
            emotionHeatmap=emotion_heatmap,
            emotionTrend=emotion_trend,
            systemOverview=system_overview,
            userActivity=user_activity,
        )
