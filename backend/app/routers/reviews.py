from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.draft import Draft, DraftVersion
from app.models.finding import Finding
from app.models.approval import Approval
from app.schemas.approval import ApprovalCreate, ApprovalOut, ReviewQueueItem
from app.routers.auth import get_current_user
from app.services.workflow import check_has_sensitive_claims
from app.services.audit import log_audit_event

router = APIRouter(tags=["Review & Approval Queue"])

@router.get("/reviews", response_model=List[ReviewQueueItem])
def get_review_queue(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Only brand_manager or reviewer (legal) can see the queue
    drafts = db.query(Draft).filter(
        Draft.workspace_id == current_user.workspace_id,
        Draft.status.in_(["IN_REVIEW", "DISPUTED", "CHANGES_REQUESTED"])
    ).order_by(Draft.updated_at.desc()).all()

    queue = []
    for d in drafts:
        current_v = db.query(DraftVersion).filter(
            DraftVersion.draft_id == d.id,
            DraftVersion.version_no == d.current_version
        ).first()

        findings = current_v.findings if current_v else []
        has_sensitive, unsupported_cnt, high_cnt = check_has_sensitive_claims(findings)

        queue.append(ReviewQueueItem(
            draft_id=d.id,
            title=d.title,
            author_id=d.author_id,
            author_name=d.author.name if d.author else "Unknown",
            status=d.status,
            current_version=d.current_version,
            has_sensitive_claims=has_sensitive,
            unsupported_claims_count=unsupported_cnt,
            high_severity_count=high_cnt,
            findings_count=len(findings),
            created_at=d.created_at,
            updated_at=d.updated_at
        ))
    return queue

@router.post("/drafts/{draft_id}/approve", response_model=ApprovalOut)
def approve_draft(
    draft_id: str,
    req: ApprovalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["brand_manager", "reviewer"]:
        raise HTTPException(status_code=403, detail="Only brand managers or legal reviewers can approve drafts")

    draft = db.query(Draft).filter(
        Draft.id == draft_id,
        Draft.workspace_id == current_user.workspace_id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    current_v = db.query(DraftVersion).filter(
        DraftVersion.draft_id == draft.id,
        DraftVersion.version_no == draft.current_version
    ).first()
    if not current_v:
        raise HTTPException(status_code=400, detail="Current version not found")

    findings = current_v.findings
    has_sensitive, _, _ = check_has_sensitive_claims(findings)

    # If draft has sensitive/unsupported claims, legal reviewer is required
    if has_sensitive and current_user.role != "reviewer":
        raise HTTPException(
            status_code=403,
            detail="This draft contains high-severity findings or unsupported claims and requires Legal Reviewer approval."
        )

    draft.status = "APPROVED"
    approval = Approval(
        draft_id=draft.id,
        version_id=current_v.id,
        approver_id=current_user.id,
        decision="approved",
        note=req.note
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    log_audit_event(
        db=db,
        workspace_id=current_user.workspace_id,
        actor_id=current_user.id,
        event_type="draft_approved",
        entity_type="draft",
        entity_id=draft.id,
        metadata={"approver_role": current_user.role, "version": draft.current_version}
    )

    out = ApprovalOut.model_validate(approval)
    out.approver_name = current_user.name
    out.approver_role = current_user.role
    return out

@router.post("/drafts/{draft_id}/request-changes", response_model=ApprovalOut)
def request_changes(
    draft_id: str,
    req: ApprovalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role not in ["brand_manager", "reviewer"]:
        raise HTTPException(status_code=403, detail="Only brand managers or legal reviewers can request changes")

    draft = db.query(Draft).filter(
        Draft.id == draft_id,
        Draft.workspace_id == current_user.workspace_id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    current_v = db.query(DraftVersion).filter(
        DraftVersion.draft_id == draft.id,
        DraftVersion.version_no == draft.current_version
    ).first()

    draft.status = "CHANGES_REQUESTED"
    approval = Approval(
        draft_id=draft.id,
        version_id=current_v.id if current_v else "",
        approver_id=current_user.id,
        decision="changes_requested",
        note=req.note
    )
    db.add(approval)
    db.commit()
    db.refresh(approval)

    log_audit_event(
        db=db,
        workspace_id=current_user.workspace_id,
        actor_id=current_user.id,
        event_type="changes_requested",
        entity_type="draft",
        entity_id=draft.id,
        metadata={"note": req.note}
    )

    out = ApprovalOut.model_validate(approval)
    out.approver_name = current_user.name
    out.approver_role = current_user.role
    return out
