from pydantic import BaseModel


class DailyTrendItem(BaseModel):
    date: str
    sessionCount: int
    userCount: int


class ConsultationStats(BaseModel):
    totalSessions: int
    avgDurationMinutes: int
    dailyTrend: list[DailyTrendItem]


class GridDataItem(BaseModel):
    x: int
    y: int
    value: int
    avgMoodScore: float
    dominantEmotion: str


class EmotionHeatmap(BaseModel):
    dateRange: str
    emotionDistribution: list
    gridData: list[GridDataItem]
    peakEmotionTime: str


class EmotionTrendItem(BaseModel):
    date: str
    avgMoodScore: float
    dominantEmotion: str
    negativeRatio: float
    positiveRatio: float
    recordCount: int


class SystemOverview(BaseModel):
    totalUsers: int
    activeUsers: int
    totalDiaries: int
    totalSessions: int
    todayNewUsers: int
    todayNewDiaries: int
    todayNewSessions: int
    avgMoodScore: float


class UserActivityItem(BaseModel):
    date: str
    activeUsers: int
    newUsers: int
    diaryUsers: int
    consultationUsers: int


class AnalyticsOverviewResponse(BaseModel):
    consultationStats: ConsultationStats
    emotionHeatmap: EmotionHeatmap
    emotionTrend: list[EmotionTrendItem]
    systemOverview: SystemOverview
    userActivity: list[UserActivityItem]
