import math
from datetime import datetime, timezone

from sqlalchemy import desc
from sqlalchemy.orm import Session, joinedload

from app.models.risk_alert import STATUS_PENDING, STATUS_PROCESSING, STATUS_RESOLVED, RiskAlert
from app.models.user import User
from app.schemas.risk_alert import RiskAlertPageResponse, RiskAlertResponse, UpdateRiskAlertRequest


def _to_iso(dt: datetime | None) -> str:
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def build_risk_alert_response(alert: RiskAlert) -> RiskAlertResponse:
    return RiskAlertResponse(
        id=alert.id,
        userId=alert.user_id,
        userNickname=alert.user.display_name if alert.user else "",
        sessionId=alert.session_id,
        riskLevel=alert.risk_level,
        triggerReason=alert.trigger_reason,
        userMessage=alert.user_message,
        status=alert.status,
        statusText=alert.status_text,
        adminNote=alert.admin_note,
        resolvedAt=_to_iso(alert.resolved_at),
        createdAt=_to_iso(alert.created_at),
        updatedAt=_to_iso(alert.updated_at),
    )


class RiskAlertService:
    def __init__(self, db: Session):
        self.db = db

    def create_alert(
        self,
        user_id: int,
        session_id: int | None,
        risk_level: int,
        trigger_reason: str,
        user_message: str,
    ) -> RiskAlert | None:
        if risk_level < 2:
            return None

        recent = (
            self.db.query(RiskAlert)
            .filter(
                RiskAlert.user_id == user_id,
                RiskAlert.session_id == session_id,
                RiskAlert.status.in_([STATUS_PENDING, STATUS_PROCESSING]),
            )
            .order_by(desc(RiskAlert.created_at))
            .first()
        )
        if recent and recent.risk_level >= risk_level:
            return recent

        alert = RiskAlert(
            user_id=user_id,
            session_id=session_id,
            risk_level=risk_level,
            trigger_reason=trigger_reason,
            user_message=user_message[:500],
            status=STATUS_PENDING,
        )
        self.db.add(alert)
        self.db.commit()
        self.db.refresh(alert)
        return alert

    def list_alerts(
        self,
        page_num: int = 1,
        page_size: int = 10,
        status: str = "",
        risk_level: str = "",
    ) -> RiskAlertPageResponse:
        query = self.db.query(RiskAlert).options(joinedload(RiskAlert.user))

        if status:
            query = query.filter(RiskAlert.status == status)
        if risk_level:
            try:
                query = query.filter(RiskAlert.risk_level == int(risk_level))
            except ValueError:
                pass

        total = query.count()
        pages = max(math.ceil(total / page_size), 1) if page_size else 1
        current = min(max(page_num, 1), pages) if total else 1
        offset = (current - 1) * page_size

        alerts = (
            query.order_by(desc(RiskAlert.created_at), desc(RiskAlert.id))
            .offset(offset)
            .limit(page_size)
            .all()
        )
        records = [build_risk_alert_response(item) for item in alerts]
        return RiskAlertPageResponse(
            records=records,
            total=total,
            size=page_size,
            current=current,
            pages=pages,
        )

    def update_alert(self, alert_id: int, payload: UpdateRiskAlertRequest) -> RiskAlert:
        alert = (
            self.db.query(RiskAlert)
            .options(joinedload(RiskAlert.user))
            .filter(RiskAlert.id == alert_id)
            .first()
        )
        if not alert:
            raise ValueError("预警记录不存在")

        if payload.status:
            alert.status = payload.status
            if payload.status == STATUS_RESOLVED:
                alert.resolved_at = datetime.now(timezone.utc)
            elif payload.status == STATUS_PROCESSING:
                alert.resolved_at = None
        if payload.adminNote is not None:
            alert.admin_note = payload.adminNote

        self.db.commit()
        self.db.refresh(alert)
        return alert

    def get_pending_count(self) -> int:
        return (
            self.db.query(RiskAlert)
            .filter(RiskAlert.status == STATUS_PENDING)
            .count()
        )
