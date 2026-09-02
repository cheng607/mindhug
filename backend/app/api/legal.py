"""法律与合规相关公开接口。"""
from fastapi import APIRouter

from app.core.crisis import CRISIS_HOTLINE, CRISIS_HOTLINE_LABEL, CRISIS_RESOURCES, CRISIS_RESPONSE_TEMPLATE
from app.core.response import success_response as success

router = APIRouter(prefix="/legal", tags=["legal"])


@router.get("/crisis-resources")
def get_crisis_resources():
    """返回危机干预固定求助资源。"""
    return success(
        {
            "hotline": CRISIS_HOTLINE,
            "hotlineLabel": CRISIS_HOTLINE_LABEL,
            "resources": CRISIS_RESOURCES,
            "responseTemplate": CRISIS_RESPONSE_TEMPLATE,
        }
    )


@router.get("/disclaimer")
def get_disclaimer():
    """AI 免责声明文本。"""
    return success(
        {
            "title": "AI 服务免责声明",
            "content": (
                "MindHug（心语陪伴）提供的 AI 对话服务仅用于情绪倾诉与心理科普参考，"
                "不能替代专业心理咨询、精神科诊疗或紧急医疗救助。"
                "如您处于心理危机或存在自伤/伤人风险，请立即拨打心理援助热线或前往医疗机构。"
            ),
        }
    )
