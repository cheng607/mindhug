from typing import Literal

IntentType = Literal["listen", "counsel", "crisis", "knowledge"]

AGENT_NAMES: dict[IntentType, str] = {
    "listen": "倾听 Agent",
    "counsel": "咨询 Agent",
    "crisis": "危机 Agent",
    "knowledge": "知识 Agent",
}
