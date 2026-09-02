from pydantic import BaseModel, Field


class AgentPromptConfigResponse(BaseModel):
    id: int
    agentKey: str
    agentName: str
    systemPrompt: str
    model: str
    temperature: float
    maxTokens: int
    isActive: int


class UpdateAgentPromptRequest(BaseModel):
    systemPrompt: str | None = None
    model: str | None = None
    temperature: float | None = None
    maxTokens: int | None = Field(None, alias="maxTokens")
    isActive: int | None = None

    model_config = {"populate_by_name": True}
