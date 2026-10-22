import csv
import io
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from app.models.audit import AuditLog

def log_audit_event(
    db: Session,
    workspace_id: str,
    event_type: str,
    entity_type: str,
    entity_id: str,
    actor_id: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None
) -> AuditLog:
    """Creates an append-only audit log record."""
    entry = AuditLog(
        workspace_id=workspace_id,
        actor_id=actor_id,
        event_type=event_type,
        entity_type=entity_type,
        entity_id=entity_id,
        log_metadata=metadata or {}
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def generate_audit_csv(logs: List[AuditLog]) -> str:
    """Generates RFC 4180 CSV export of audit logs."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Timestamp",
        "Event Type",
        "Entity Type",
        "Entity ID",
        "Actor ID",
        "Actor Name",
        "Actor Email",
        "Metadata"
    ])
    for l in logs:
        actor_name = l.actor.name if l.actor else "System"
        actor_email = l.actor.email if l.actor else "system@brandguard.internal"
        writer.writerow([
            l.created_at.isoformat() if l.created_at else "",
            l.event_type,
            l.entity_type,
            l.entity_id,
            l.actor_id or "",
            actor_name,
            actor_email,
            str(l.log_metadata or "")
        ])
    return output.getvalue()
