from pydantic import BaseModel


class AgentLogItemResponse(BaseModel):
    id: int
    sessionId: int
    userId: int
    userNickname: str
    userMessage: str
    intent: str
    activeAgent: str
    latencyMs: int
    llmUsed: bool
    createdAt: str


class AgentLogPageResponse(BaseModel):
    records: list[AgentLogItemResponse]
    total: int
    size: int
    current: int
    pages: int
