"""pytest 全局配置：在导入 app 之前隔离测试环境，避免 .env 真实 LLM 干扰。"""
import os

import pytest

# 强制 mock，避免 backend/.env 中 LLM_PROVIDER=deepseek 导致测试走真实 API
os.environ["LLM_PROVIDER"] = "mock"
os.environ["LLM_API_KEY"] = ""
os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
os.environ.setdefault("RATE_LIMIT_USE_REDIS", "false")
# 单测默认关闭外网搜索，避免网络抖动；白名单逻辑另有专项用例覆盖
os.environ.setdefault("WHITELIST_SEARCH_ENABLED", "false")


@pytest.fixture(autouse=True)
def _ensure_mock_llm():
    """每次测试前重置 LLM 状态，防止模块级 settings 被 .env 污染。"""
    from app.core.config import settings
    from app.services.llm_service import llm_service

    settings.LLM_PROVIDER = "mock"
    settings.LLM_API_KEY = ""
    settings.WHITELIST_SEARCH_ENABLED = False
    llm_service.enabled = False
    llm_service.api_key = ""
    yield
