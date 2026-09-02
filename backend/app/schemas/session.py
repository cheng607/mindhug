from pydantic import BaseModel, Field


class StartSessionRequest(BaseModel):
    sessionId: str | None = None
    status: str | None = None
    initialMessage: str | None = ""
    sessionTitle: str | None = "新会话"


class StreamChatRequest(BaseModel):
    sessionId: str
    userMessage: str = Field(..., min_length=1)


class SessionListQuery(BaseModel):
    pageNum: str | None = "1"
    pageSize: str | None = "20"
    currentPage: str | None = None
    size: str | None = None
    emotionTag: str | None = ""


class SessionItemResponse(BaseModel):
    id: int
    sessionTitle: str
    userId: int
    userNickname: str
    startedAt: str
    lastMessageTime: str
    lastMessageContent: str
    messageCount: int
    durationMinutes: int


class SessionPageResponse(BaseModel):
    records: list[SessionItemResponse]
    total: int
    size: int
    current: int
    pages: int


class StartSessionResponse(BaseModel):
    sessionId: str
    status: str
    startTime: int
    expiryTime: int
    initialMessage: str
    messageCount: int
    userHash: int


class MessageResponse(BaseModel):
    id: int
    sessionId: int
    content: str
    contentLength: int
    contentPreview: str
    senderType: int
    senderTypeDesc: str
    messageType: int
    messageTypeDesc: str
    createdAt: str
    citations: list[dict] | None = None


class EmotionAnalysisResponse(BaseModel):
    primaryEmotion: str
    emotionScore: float
    isNegative: bool
    riskLevel: int
    keywords: list[str]
    suggestion: str
    icon: str
    label: str
    riskDescription: str
    improvementSuggestions: list[str]
    timestamp: int
