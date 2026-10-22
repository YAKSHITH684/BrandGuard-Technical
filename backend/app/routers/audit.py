from typing import List, Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.audit import AuditLogOut
from app.routers.auth import get_current_user
from app.services.audit import generate_audit_csv

router = APIRouter(prefix="/audit", tags=["Audit Log"])

@router.get("", response_model=List[AuditLogOut])
def get_audit_log(
    event_type: Optional[str] = Query(None),
    entity_type: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).filter(AuditLog.workspace_id == current_user.workspace_id)
    if event_type:
        query = query.filter(AuditLog.event_type == event_type)
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)

    logs = query.order_by(AuditLog.created_at.desc()).limit(limit).all()

    out = []
    for l in logs:
        item = AuditLogOut.model_validate(l)
        item.actor_name = l.actor.name if l.actor else "System"
        item.actor_email = l.actor.email if l.actor else "system@brandguard.internal"
        out.append(item)
    return out

@router.get("/export")
def export_audit_log_csv(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(AuditLog).filter(
        AuditLog.workspace_id == current_user.workspace_id
    ).order_by(AuditLog.created_at.desc()).all()

    csv_data = generate_audit_csv(logs)

    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="brandguard_audit_trail.csv"'}
    )
