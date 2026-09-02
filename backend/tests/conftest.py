"""pytest 全局配置：在导入 app 之前关闭限流，避免测试间 429 冲突。"""
import os

os.environ.setdefault("RATE_LIMIT_ENABLED", "false")
os.environ.setdefault("RATE_LIMIT_USE_REDIS", "false")
