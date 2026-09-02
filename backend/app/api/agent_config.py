from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.schemas.agent_config import UpdateAgentPromptRequest
from app.services.prompt_config_service import PromptConfigService, build_prompt_config_response

router = APIRouter(prefix="/admin/agent-config", tags=["admin-agent-config"])


@router.get("")
def list_agent_configs(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = PromptConfigService(db)
    service.seed_defaults()
    data = service.list_configs()
    return success_response(data=[item.model_dump() for item in data], msg="查询成功")


@router.put("/{agent_key}")
def update_agent_config(
    agent_key: str,
    payload: UpdateAgentPromptRequest,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = PromptConfigService(db)
    service.seed_defaults()
    try:
        config = service.update_config(agent_key, payload)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    return success_response(data=build_prompt_config_response(config).model_dump(), msg="更新成功")
