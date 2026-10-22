from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.finding import Finding
from app.schemas.finding import FindingActionCreate, FindingActionOut
from app.routers.auth import get_current_user
from app.services.workflow import record_finding_action

router = APIRouter(prefix="/findings", tags=["Findings & Overrides"])

@router.post("/{finding_id}/accept", response_model=FindingActionOut)
def accept_finding(
    finding_id: str,
    req: FindingActionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    action = record_finding_action(
        db=db,
        finding_id=finding_id,
        actor_id=current_user.id,
        action="accept",
        reason=req.reason,
        edited_text=req.edited_text
    )
    out = FindingActionOut.model_validate(action)
    out.actor_name = current_user.name
    return out

@router.post("/{finding_id}/edit", response_model=FindingActionOut)
def edit_finding(
    finding_id: str,
    req: FindingActionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.edited_text:
        raise HTTPException(status_code=400, detail="Edited text is required for edit action")

    action = record_finding_action(
        db=db,
        finding_id=finding_id,
        actor_id=current_user.id,
        action="edit",
        reason=req.reason,
        edited_text=req.edited_text
    )
    out = FindingActionOut.model_validate(action)
    out.actor_name = current_user.name
    return out

@router.post("/{finding_id}/reject", response_model=FindingActionOut)
def reject_finding(
    finding_id: str,
    req: FindingActionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    action = record_finding_action(
        db=db,
        finding_id=finding_id,
        actor_id=current_user.id,
        action="reject",
        reason=req.reason or "Creator override"
    )
    out = FindingActionOut.model_validate(action)
    out.actor_name = current_user.name
    return out

@router.post("/{finding_id}/dispute", response_model=FindingActionOut)
def dispute_finding(
    finding_id: str,
    req: FindingActionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not req.reason:
        raise HTTPException(status_code=400, detail="A detailed reason is required to dispute a finding")

    action = record_finding_action(
        db=db,
        finding_id=finding_id,
        actor_id=current_user.id,
        action="dispute",
        reason=req.reason
    )
    out = FindingActionOut.model_validate(action)
    out.actor_name = current_user.name
    return out
