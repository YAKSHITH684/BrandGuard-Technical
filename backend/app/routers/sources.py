from typing import List, Optional
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.source import SourceDocument, GlossaryTerm
from app.schemas.source import (
    SourceDocumentOut,
    SourceChunkOut,
    GlossaryTermCreate,
    GlossaryTermOut,
    IngestSourcePasteRequest
)
from app.routers.auth import get_current_user
from app.services.ingestion import ingest_source_document, extract_text_from_file
from app.services.audit import log_audit_event

router = APIRouter(tags=["Sources & Guidelines"])

@router.get("/sources", response_model=List[SourceDocumentOut])
def list_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(SourceDocument).filter(
        SourceDocument.workspace_id == current_user.workspace_id
    ).order_by(SourceDocument.uploaded_at.desc()).all()

@router.post("/sources", response_model=SourceDocumentOut)
async def upload_or_paste_source(
    title: Optional[str] = Form(None),
    source_type: Optional[str] = Form(None),  # guideline | fact_sheet | glossary
    content: Optional[str] = Form(None),
    effective_date: Optional[str] = Form(None),
    expires_on: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    eff_d = None
    exp_d = None
    if effective_date:
        try:
            eff_d = date.fromisoformat(effective_date)
        except ValueError:
            pass
    if expires_on:
        try:
            exp_d = date.fromisoformat(expires_on)
        except ValueError:
            pass

    extracted_content = ""
    doc_title = title or "Untitled Source"
    doc_type = source_type or "guideline"

    if file:
        doc_title = title or file.filename
        file_bytes = await file.read()
        extracted_content = extract_text_from_file(file.filename, file_bytes)
    elif content:
        extracted_content = content
    else:
        raise HTTPException(status_code=400, detail="Either file or content must be provided")

    doc = ingest_source_document(
        db=db,
        workspace_id=current_user.workspace_id,
        title=doc_title,
        source_type=doc_type,
        content=extracted_content,
        uploaded_by=current_user.id,
        effective_date=eff_d,
        expires_on=exp_d
    )
    return doc

@router.post("/sources/paste", response_model=SourceDocumentOut)
def paste_source_json(
    req: IngestSourcePasteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = ingest_source_document(
        db=db,
        workspace_id=current_user.workspace_id,
        title=req.title,
        source_type=req.source_type,
        content=req.content,
        uploaded_by=current_user.id,
        effective_date=req.effective_date,
        expires_on=req.expires_on
    )
    return doc

@router.get("/sources/{doc_id}/status")
def get_source_status(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(SourceDocument).filter(
        SourceDocument.id == doc_id,
        SourceDocument.workspace_id == current_user.workspace_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Source document not found")
    return {"id": doc.id, "status": doc.status, "chunk_count": doc.chunk_count}

@router.delete("/sources/{doc_id}")
def delete_source(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    doc = db.query(SourceDocument).filter(
        SourceDocument.id == doc_id,
        SourceDocument.workspace_id == current_user.workspace_id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Source document not found")

    db.delete(doc)
    db.commit()

    log_audit_event(
        db=db,
        workspace_id=current_user.workspace_id,
        actor_id=current_user.id,
        event_type="source_deleted",
        entity_type="source_document",
        entity_id=doc_id,
        metadata={"title": doc.title}
    )
    return {"message": "Source document and chunks deleted"}

# Glossary management
@router.get("/glossary", response_model=List[GlossaryTermOut])
def list_glossary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(GlossaryTerm).filter(
        GlossaryTerm.workspace_id == current_user.workspace_id
    ).all()

@router.post("/glossary", response_model=GlossaryTermOut)
def create_glossary_term(
    req: GlossaryTermCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    term = GlossaryTerm(
        workspace_id=current_user.workspace_id,
        term=req.term.strip(),
        type=req.type,
        replacement=req.replacement.strip() if req.replacement else None,
        note=req.note
    )
    db.add(term)
    db.commit()
    db.refresh(term)

    log_audit_event(
        db=db,
        workspace_id=current_user.workspace_id,
        actor_id=current_user.id,
        event_type="glossary_term_created",
        entity_type="glossary_term",
        entity_id=term.id,
        metadata={"term": term.term, "type": term.type}
    )
    return term

@router.delete("/glossary/{term_id}")
def delete_glossary_term(
    term_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    term = db.query(GlossaryTerm).filter(
        GlossaryTerm.id == term_id,
        GlossaryTerm.workspace_id == current_user.workspace_id
    ).first()
    if not term:
        raise HTTPException(status_code=404, detail="Term not found")

    db.delete(term)
    db.commit()
    return {"message": "Glossary term deleted"}
