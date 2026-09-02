from pydantic import BaseModel, Field


class RiskAlertResponse(BaseModel):
    id: int
    userId: int
    userNickname: str
    sessionId: int | None
    riskLevel: int
    triggerReason: str
    userMessage: str
    status: str
    statusText: str
    adminNote: str
    resolvedAt: str
    createdAt: str
    updatedAt: str


class RiskAlertPageResponse(BaseModel):
    records: list[RiskAlertResponse]
    total: int
    size: int
    current: int
    pages: int


class UpdateRiskAlertRequest(BaseModel):
    status: str | None = None
    adminNote: str | None = None
