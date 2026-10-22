import difflib
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.draft import Draft, DraftVersion
from app.models.finding import Finding, FindingAction
from app.models.approval import Approval
from app.services.audit import log_audit_event

def record_finding_action(
    db: Session,
    finding_id: str,
    actor_id: str,
    action: str,  # accept | edit | reject | dispute
    reason: Optional[str] = None,
    edited_text: Optional[str] = None
) -> FindingAction:
    finding = db.query(Finding).filter(Finding.id == finding_id).first()
    if not finding:
        raise ValueError("Finding not found")

    action_record = FindingAction(
        finding_id=finding_id,
        actor_id=actor_id,
        action=action,
        reason=reason,
        edited_text=edited_text
    )
    db.add(action_record)

    # If action is dispute, update draft status to DISPUTED if currently IN_REVIEW
    if action == "dispute":
        draft_version = db.query(DraftVersion).filter(DraftVersion.id == finding.version_id).first()
        if draft_version:
            draft = db.query(Draft).filter(Draft.id == draft_version.draft_id).first()
            if draft and draft.status == "IN_REVIEW":
                draft.status = "DISPUTED"

    db.commit()
    db.refresh(action_record)

    # Log audit event
    draft_version = db.query(DraftVersion).filter(DraftVersion.id == finding.version_id).first()
    if draft_version:
        log_audit_event(
            db=db,
            workspace_id=draft_version.draft.workspace_id,
            actor_id=actor_id,
            event_type="finding_action",
            entity_type="finding",
            entity_id=finding_id,
            metadata={
                "action": action,
                "rule": finding.rule,
                "reason": reason,
                "edited_text": edited_text
            }
        )

    return action_record

def generate_version_diff(from_text: str, to_text: str, from_v: int, to_v: int) -> Dict[str, Any]:
    from_lines = from_text.splitlines()
    to_lines = to_text.splitlines()

    matcher = difflib.SequenceMatcher(None, from_lines, to_lines)
    diff_lines = []

    for tag, i1, i2, j1, j2 in matcher.get_opcodes():
        if tag == "equal":
            for line in from_lines[i1:i2]:
                diff_lines.append({"type": "equal", "text": line})
        elif tag == "delete":
            for line in from_lines[i1:i2]:
                diff_lines.append({"type": "removed", "text": line})
        elif tag == "insert":
            for line in to_lines[j1:j2]:
                diff_lines.append({"type": "added", "text": line})
        elif tag == "replace":
            for line in from_lines[i1:i2]:
                diff_lines.append({"type": "removed", "text": line})
            for line in to_lines[j1:j2]:
                diff_lines.append({"type": "added", "text": line})

    return {
        "from_version": from_v,
        "to_version": to_v,
        "from_content": from_text,
        "to_content": to_text,
        "diff_lines": diff_lines
    }

def check_has_sensitive_claims(findings: List[Finding]) -> Tuple[bool, int, int]:
    unsupported_count = len([f for f in findings if f.claim_label == "unsupported"])
    high_sev_count = len([f for f in findings if f.severity == "high"])
    has_sensitive = (unsupported_count > 0 or high_sev_count > 0)
    return has_sensitive, unsupported_count, high_sev_count
