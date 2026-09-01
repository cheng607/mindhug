from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.core.response import success_response
from app.models.user import User
from app.services.analytics_service import AnalyticsService

router = APIRouter(prefix="/data-analytics", tags=["data-analytics"])


@router.get("/overview")
def get_analytics_overview(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = AnalyticsService(db)
    data = service.get_overview()
    return success_response(data=data.model_dump(), msg="查询成功")
