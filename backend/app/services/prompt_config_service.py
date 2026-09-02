from sqlalchemy.orm import Session

from app.agents.prompts import AGENT_PROMPTS
from app.agents.types import AGENT_NAMES, IntentType
from app.core.config import settings
from app.models.agent_prompt_config import AgentPromptConfig
from app.schemas.agent_config import AgentPromptConfigResponse, UpdateAgentPromptRequest


def build_prompt_config_response(config: AgentPromptConfig) -> AgentPromptConfigResponse:
    return AgentPromptConfigResponse(
        id=config.id,
        agentKey=config.agent_key,
        agentName=config.agent_name,
        systemPrompt=config.system_prompt,
        model=config.model,
        temperature=config.temperature,
        maxTokens=config.max_tokens,
        isActive=config.is_active,
    )


class PromptConfigService:
    def __init__(self, db: Session):
        self.db = db

    def seed_defaults(self) -> None:
        if self.db.query(AgentPromptConfig).count() > 0:
            return
        for key, prompt in AGENT_PROMPTS.items():
            intent: IntentType = key  # type: ignore[assignment]
            self.db.add(
                AgentPromptConfig(
                    agent_key=key,
                    agent_name=AGENT_NAMES[intent],
                    system_prompt=prompt,
                    model=settings.llm_model,
                    temperature=settings.LLM_TEMPERATURE,
                    max_tokens=settings.LLM_MAX_TOKENS,
                    is_active=1,
                )
            )
        self.db.commit()

    def sync_prompts_from_code(self) -> None:
        """将代码中的默认 Prompt 同步到数据库（版本升级时自动生效）。"""
        for key, prompt in AGENT_PROMPTS.items():
            intent: IntentType = key  # type: ignore[assignment]
            config = (
                self.db.query(AgentPromptConfig)
                .filter(AgentPromptConfig.agent_key == key)
                .first()
            )
            if config:
                config.system_prompt = prompt
                config.agent_name = AGENT_NAMES[intent]
            else:
                self.db.add(
                    AgentPromptConfig(
                        agent_key=key,
                        agent_name=AGENT_NAMES[intent],
                        system_prompt=prompt,
                        model=settings.llm_model,
                        temperature=settings.LLM_TEMPERATURE,
                        max_tokens=settings.LLM_MAX_TOKENS,
                        is_active=1,
                    )
                )
        self.db.commit()

    def list_configs(self) -> list[AgentPromptConfigResponse]:
        configs = (
            self.db.query(AgentPromptConfig)
            .order_by(AgentPromptConfig.id.asc())
            .all()
        )
        return [build_prompt_config_response(item) for item in configs]

    def get_prompt(self, agent_key: IntentType) -> str:
        config = (
            self.db.query(AgentPromptConfig)
            .filter(AgentPromptConfig.agent_key == agent_key, AgentPromptConfig.is_active == 1)
            .first()
        )
        if config:
            return config.system_prompt
        return AGENT_PROMPTS[agent_key]

    def get_llm_params(self, agent_key: IntentType) -> dict[str, str | float | int]:
        config = (
            self.db.query(AgentPromptConfig)
            .filter(AgentPromptConfig.agent_key == agent_key, AgentPromptConfig.is_active == 1)
            .first()
        )
        if config:
            return {
                "model": config.model or settings.llm_model,
                "temperature": config.temperature,
                "max_tokens": config.max_tokens,
            }
        return {
            "model": settings.llm_model,
            "temperature": settings.LLM_TEMPERATURE,
            "max_tokens": settings.LLM_MAX_TOKENS,
        }

    def get_config(self, agent_key: str) -> AgentPromptConfig:
        config = (
            self.db.query(AgentPromptConfig)
            .filter(AgentPromptConfig.agent_key == agent_key)
            .first()
        )
        if not config:
            raise ValueError("Agent 配置不存在")
        return config

    def update_config(self, agent_key: str, payload: UpdateAgentPromptRequest) -> AgentPromptConfig:
        config = self.get_config(agent_key)
        if payload.systemPrompt is not None:
            config.system_prompt = payload.systemPrompt
        if payload.model is not None:
            config.model = payload.model
        if payload.temperature is not None:
            config.temperature = payload.temperature
        if payload.maxTokens is not None:
            config.max_tokens = payload.maxTokens
        if payload.isActive is not None:
            config.is_active = payload.isActive
        self.db.commit()
        self.db.refresh(config)
        return config
