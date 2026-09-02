from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_admin_user
from app.core.response import error_response, success_response
from app.models.user import User
from app.schemas.risk_alert import UpdateRiskAlertRequest
from app.services.risk_alert_service import RiskAlertService

router = APIRouter(prefix="/admin/risk-alerts", tags=["admin-risk-alerts"])


def _parse_page(value: str | None, default: int) -> int:
    try:
        return max(int(value), 1) if value else default
    except (TypeError, ValueError):
        return default


@router.get("")
def list_risk_alerts(
    pageNum: str | None = Query("1"),
    pageSize: str | None = Query("10"),
    status: str | None = Query(""),
    riskLevel: str | None = Query(""),
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = RiskAlertService(db)
    data = service.list_alerts(
        page_num=_parse_page(pageNum, 1),
        page_size=_parse_page(pageSize, 10),
        status=status or "",
        risk_level=riskLevel or "",
    )
    return success_response(data=data.model_dump(), msg="查询成功")


@router.get("/pending-count")
def get_pending_count(
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    count = RiskAlertService(db).get_pending_count()
    return success_response(data={"count": count}, msg="查询成功")


@router.put("/{alert_id}")
def update_risk_alert(
    alert_id: int,
    payload: UpdateRiskAlertRequest,
    _admin: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    service = RiskAlertService(db)
    try:
        alert = service.update_alert(alert_id, payload)
    except ValueError as exc:
        return error_response("404", str(exc), status_code=404)
    from app.services.risk_alert_service import build_risk_alert_response

    return success_response(data=build_risk_alert_response(alert).model_dump(), msg="更新成功")
