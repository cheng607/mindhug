from pydantic import BaseModel, Field


class DiaryCreateRequest(BaseModel):
    diaryContent: str = Field(..., min_length=1)
    diaryDate: str
    dominantEmotion: str
    emotionTriggers: str = ""
    moodScore: int = Field(..., ge=1, le=10)
    sleepQuality: int = Field(..., ge=1, le=5)
    stressLevel: int = Field(..., ge=1, le=5)


class DiaryItemResponse(BaseModel):
    id: int
    userId: int
    username: str
    nickname: str
    diaryContent: str
    diaryContentPreview: str
    contentLength: int
    diaryDate: str
    dominantEmotion: str
    emotionTriggers: str
    moodScore: int
    sleepQuality: int
    stressLevel: int
    aiAnalysisStatus: str
    aiEmotionAnalysis: str
    aiAnalysisUpdatedAt: str
    hasAiEmotionAnalysis: bool
    createdAt: str
    updatedAt: str


class DiaryPageResponse(BaseModel):
    records: list[DiaryItemResponse]
    total: int
    size: int
    current: int
    pages: int
