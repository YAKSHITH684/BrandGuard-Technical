from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.draft import Draft, DraftVersion
from app.models.finding import Finding
from app.models.comment import Comment
from app.schemas.draft import (
    DraftCreate,
    DraftOut,
    DraftDetailOut,
    DraftVersionOut,
    VersionDiffOut
)
from app.schemas.comment import CommentCreate, CommentOut
from app.routers.auth import get_current_user
from app.services.review_pipeline import run_brandguard_review
from app.services.workflow import generate_version_diff
from app.services.audit import log_audit_event
from app.checks.readability import calculate_readability

router = APIRouter(prefix="/drafts", tags=["Drafts & Reviews"])

@router.get("", response_model=List[DraftOut])
def list_drafts(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Draft).filter(Draft.workspace_id == current_user.workspace_id)
    if status_filter:
        query = query.filter(Draft.status == status_filter)
    drafts = query.order_by(Draft.updated_at.desc()).all()

    # Attach author names
    out = []
    for d in drafts:
        item = DraftOut.model_validate(d)
        item.author_name = d.author.name if d.author else "Unknown"
        out.append(item)
    return out

@router.post("", response_model=DraftDetailOut)
def create_draft_and_review(
    req: DraftCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Idempotency Guard: prevent duplicate draft creation from rapid double clicks
    recent_cutoff = datetime.utcnow() - timedelta(seconds=6)
    recent_draft = db.query(Draft).filter(
        Draft.workspace_id == current_user.workspace_id,
        Draft.author_id == current_user.id,
        Draft.title == req.title,
        Draft.created_at >= recent_cutoff
    ).first()
    if recent_draft:
        return get_draft_detail_by_id(recent_draft.id, current_user.workspace_id, db)

    # 1. Create draft
    draft = Draft(
        workspace_id=current_user.workspace_id,
        author_id=current_user.id,
        title=req.title,
        status="DRAFT",
        current_version=1
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)

    # 2. Create version 1
    version = DraftVersion(
        draft_id=draft.id,
        version_no=1,
        content=req.content
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    # 3. Run review pipeline with robust error handling (no hang on invalid assets)
    try:
        findings, ai_status = run_brandguard_review(
            db=db,
            workspace_id=current_user.workspace_id,
            draft_version_id=version.id,
            raw_content=req.content,
            actor_id=current_user.id,
            color_pairs=req.color_pairs,
            alt_texts=req.alt_texts,
            images=[img.model_dump() for img in req.images] if req.images else None
        )
    except ValueError as ve:
        db.delete(version)
        db.delete(draft)
        db.commit()
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        db.delete(version)
        db.delete(draft)
        db.commit()
        raise HTTPException(status_code=400, detail=f"Validation failed: {str(e)}")

    log_audit_event(
        db=db,
        workspace_id=current_user.workspace_id,
        actor_id=current_user.id,
        event_type="draft_created",
        entity_type="draft",
        entity_id=draft.id,
        metadata={"title": draft.title, "version": 1}
    )

    readability = calculate_readability(req.content)

    return get_draft_detail_by_id(draft.id, current_user.workspace_id, db, ai_status)

@router.get("/{draft_id}", response_model=DraftDetailOut)
def get_draft_detail(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_draft_detail_by_id(draft_id, current_user.workspace_id, db)

def get_draft_detail_by_id(draft_id: str, workspace_id: str, db: Session, ai_status: str = "available") -> DraftDetailOut:
    draft = db.query(Draft).filter(
        Draft.id == draft_id,
        Draft.workspace_id == workspace_id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    current_ver = db.query(DraftVersion).filter(
        DraftVersion.draft_id == draft.id,
        DraftVersion.version_no == draft.current_version
    ).first()

    versions = db.query(DraftVersion).filter(
        DraftVersion.draft_id == draft.id
    ).order_by(DraftVersion.version_no.desc()).all()

    # Format comments with author details
    comments_out = []
    for c in draft.comments:
        c_item = CommentOut.model_validate(c)
        c_item.author_name = c.author.name if c.author else "User"
        c_item.author_role = c.author.role if c.author else "creator"
        comments_out.append(c_item)

    readability_score = 0.0
    if current_ver:
        readability_score = calculate_readability(current_ver.content)["flesch_reading_ease"]

    detail = DraftDetailOut(
        id=draft.id,
        workspace_id=draft.workspace_id,
        author_id=draft.author_id,
        author_name=draft.author.name if draft.author else "Unknown",
        title=draft.title,
        status=draft.status,
        current_version=draft.current_version,
        created_at=draft.created_at,
        updated_at=draft.updated_at,
        current_version_data=DraftVersionOut.model_validate(current_ver) if current_ver else None,
        versions=[DraftVersionOut.model_validate(v) for v in versions],
        comments=comments_out,
        approvals=draft.approvals,
        readability_score=readability_score,
        ai_status=ai_status
    )
    return detail

@router.post("/{draft_id}/versions", response_model=DraftDetailOut)
def create_draft_version(
    draft_id: str,
    req: DraftCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    draft = db.query(Draft).filter(
        Draft.id == draft_id,
        Draft.workspace_id == current_user.workspace_id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    new_version_no = draft.current_version + 1
    draft.current_version = new_version_no
    draft.title = req.title or draft.title
    db.commit()

    version = DraftVersion(
        draft_id=draft.id,
        version_no=new_version_no,
        content=req.content
    )
    db.add(version)
    db.commit()
    db.refresh(version)

    try:
        findings, ai_status = run_brandguard_review(
            db=db,
            workspace_id=current_user.workspace_id,
            draft_version_id=version.id,
            raw_content=req.content,
            actor_id=current_user.id,
            color_pairs=req.color_pairs,
            alt_texts=req.alt_texts,
            images=[img.model_dump() for img in req.images] if req.images else None
        )
    except ValueError as ve:
        db.delete(version)
        draft.current_version = draft.current_version - 1
        db.commit()
        raise HTTPException(status_code=400, detail=str(ve))

    log_audit_event(
        db=db,
        workspace_id=current_user.workspace_id,
        actor_id=current_user.id,
        event_type="draft_revision_submitted",
        entity_type="draft_version",
        entity_id=version.id,
        metadata={"draft_id": draft.id, "version_no": new_version_no}
    )

    return get_draft_detail_by_id(draft.id, current_user.workspace_id, db, ai_status)

@router.get("/{draft_id}/diff", response_model=VersionDiffOut)
def get_version_diff(
    draft_id: str,
    from_version: int = Query(1, alias="from"),
    to_version: int = Query(2, alias="to"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    draft = db.query(Draft).filter(
        Draft.id == draft_id,
        Draft.workspace_id == current_user.workspace_id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    v_from = db.query(DraftVersion).filter(
        DraftVersion.draft_id == draft.id,
        DraftVersion.version_no == from_version
    ).first()
    v_to = db.query(DraftVersion).filter(
        DraftVersion.draft_id == draft.id,
        DraftVersion.version_no == to_version
    ).first()

    if not v_from or not v_to:
        raise HTTPException(status_code=400, detail="One or both version numbers do not exist")

    diff_data = generate_version_diff(v_from.content, v_to.content, from_version, to_version)
    return diff_data

@router.post("/{draft_id}/submit")
def submit_draft_for_approval(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    draft = db.query(Draft).filter(
        Draft.id == draft_id,
        Draft.workspace_id == current_user.workspace_id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    draft.status = "IN_REVIEW"
    db.commit()

    log_audit_event(
        db=db,
        workspace_id=current_user.workspace_id,
        actor_id=current_user.id,
        event_type="draft_submitted_for_approval",
        entity_type="draft",
        entity_id=draft.id,
        metadata={"version": draft.current_version}
    )
    return {"message": "Draft submitted for brand review", "status": draft.status}

@router.get("/{draft_id}/comments", response_model=List[CommentOut])
def get_comments(
    draft_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    comments = db.query(Comment).filter(Comment.draft_id == draft_id).order_by(Comment.created_at.asc()).all()
    out = []
    for c in comments:
        item = CommentOut.model_validate(c)
        item.author_name = c.author.name if c.author else "User"
        item.author_role = c.author.role if c.author else "creator"
        out.append(item)
    return out

@router.post("/{draft_id}/comments", response_model=CommentOut)
def add_comment(
    draft_id: str,
    req: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    draft = db.query(Draft).filter(
        Draft.id == draft_id,
        Draft.workspace_id == current_user.workspace_id
    ).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    comment = Comment(
        draft_id=draft.id,
        finding_id=req.finding_id,
        author_id=current_user.id,
        body=req.body
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)

    item = CommentOut.model_validate(comment)
    item.author_name = current_user.name
    item.author_role = current_user.role
    return item
