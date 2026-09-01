from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    APP_NAME: str = "MindHug API"
    DEBUG: bool = True

    DATABASE_URL: str = "postgresql://mindhug:mindhug@localhost:5432/mindhug"
    REDIS_URL: str = "redis://localhost:6379/0"

    JWT_SECRET_KEY: str = "change-me-in-production-use-a-long-random-string"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    UPLOAD_DIR: str = "uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB

    # LLM（mock | deepseek | openai | qwen）
    LLM_PROVIDER: str = "mock"
    LLM_API_KEY: str = ""
    LLM_BASE_URL: str = ""
    LLM_MODEL: str = ""
    LLM_MAX_CONTEXT_MESSAGES: int = 20
    LLM_MAX_TOKENS: int = 1024
    LLM_TEMPERATURE: float = 0.7

    @property
    def llm_enabled(self) -> bool:
        return self.LLM_PROVIDER != "mock" and bool(self.LLM_API_KEY.strip())

    @property
    def llm_base_url(self) -> str:
        if self.LLM_BASE_URL:
            return self.LLM_BASE_URL.rstrip("/")
        presets = {
            "deepseek": "https://api.deepseek.com/v1",
            "openai": "https://api.openai.com/v1",
            "qwen": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        }
        return presets.get(self.LLM_PROVIDER, "https://api.deepseek.com/v1")

    @property
    def llm_model(self) -> str:
        if self.LLM_MODEL:
            return self.LLM_MODEL
        presets = {
            "deepseek": "deepseek-chat",
            "openai": "gpt-4o-mini",
            "qwen": "qwen-turbo",
        }
        return presets.get(self.LLM_PROVIDER, "deepseek-chat")


settings = Settings()
