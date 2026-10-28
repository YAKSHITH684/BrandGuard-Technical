from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.workspace import Workspace
from app.models.source import SourceChunk, SourceDocument
from app.schemas.checks import (
    ContrastCheckRequest,
    ContrastCheckResponse,
    ReadabilityCheckRequest,
    ReadabilityCheckResponse,
    MultimodalCheckRequest,
    MultimodalCheckResponse
)
from app.checks.contrast import evaluate_contrast_ratio
from app.checks.readability import calculate_readability
from app.checks.visual import (
    check_color_palette,
    check_logo_integrity,
    check_visual_contrast,
    check_image_alt_text
)
from app.ai.image_redaction import redact_image_privacy, validate_image_asset
from app.ai.ocr import (
    extract_text_from_image,
    extract_image_candidate_claims,
    check_image_claims_against_facts
)
from app.ai.retrieval import retrieve_relevant_chunks
from app.routers.auth import get_optional_user

router = APIRouter(prefix="/checks", tags=["Standalone Deterministic Checks"])

@router.post("/contrast", response_model=ContrastCheckResponse)
def check_contrast(req: ContrastCheckRequest):
    result = evaluate_contrast_ratio(req.foreground, req.background, req.font_size or "normal")
    return ContrastCheckResponse(**result)

@router.post("/readability", response_model=ReadabilityCheckResponse)
def check_readability(req: ReadabilityCheckRequest):
    result = calculate_readability(req.text, req.target_ease or 60.0)
    return ReadabilityCheckResponse(**result)

@router.post("/multimodal", response_model=MultimodalCheckResponse)
def check_multimodal(
    req: MultimodalCheckRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user)
):
    # 1. Resolve workspace
    ws_id = None
    if current_user and isinstance(current_user, User) and current_user.workspace_id:
        ws_id = current_user.workspace_id
    else:
        first_ws = db.query(Workspace).first()
        if first_ws:
            ws_id = first_ws.id

    # 2. Asset validation if URL / payload provided
    clean_name = req.name or "visual_asset.png"
    if req.url:
        try:
            validate_image_asset(req.url, clean_name)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    # 3. Privacy Layer (Improvement 3: Zero-exposure irreversible masking)
    img_dict = {
        "name": clean_name,
        "url": req.url,
        "has_face": bool(req.has_face),
        "has_license_plate": bool(req.has_license_plate),
        "text": req.ocr_text or ""
    }
    redacted_url, redaction_applied, blurred_elements, audit_meta = redact_image_privacy(
        img_dict,
        image_name=clean_name,
        raw_ocr_text=req.ocr_text
    )

    # 4. Visual Checks (Improvement 2: Palette, Logo, Contrast, Alt-text)
    visual_findings = []
    if req.colors:
        visual_findings.extend(check_color_palette(req.colors, clean_name))
    if req.logo_identifier or req.aspect_ratio_skew:
        visual_findings.extend(check_logo_integrity(req.logo_identifier or "", req.aspect_ratio_skew or 0.0, clean_name))
    if req.contrast_ratio is not None:
        visual_findings.extend(check_visual_contrast(req.contrast_ratio, clean_name))
    if req.alt_text is not None:
        visual_findings.extend(check_image_alt_text(req.alt_text, clean_name))

    # 5. OCR ClaimCheck (Improvement 1: Grounded factual verification)
    extracted_text = req.ocr_text if req.ocr_text is not None else extract_text_from_image(img_dict, clean_name)
    extracted_claims = extract_image_candidate_claims(extracted_text)

    retrieved_chunks = []
    if ws_id and extracted_text:
        try:
            retrieved_chunks = retrieve_relevant_chunks(db, ws_id, extracted_text, top_k=6)
        except Exception:
            retrieved_chunks = []

    if not retrieved_chunks:
        # Fallback to direct fact sheet chunks
        db_chunks = (
            db.query(SourceChunk)
            .join(SourceDocument, SourceChunk.document_id == SourceDocument.id)
            .filter(SourceDocument.source_type == "fact_sheet")
            .all()
        )
        retrieved_chunks = [
            {
                "id": c.id,
                "content": c.content,
                "section": c.section,
                "page": c.page,
                "effective_date": c.effective_date,
                "expires_on": c.expires_on
            }
            for c in db_chunks
        ]

    claim_verdicts = check_image_claims_against_facts(
        image_name=clean_name,
        extracted_claims=extracted_claims,
        retrieved_chunks=retrieved_chunks,
        redaction_applied=redaction_applied
    )

    # 6. Scoring & summary
    compliance_score = max(0.0, min(100.0, 100.0 - (len(visual_findings) * 15.0)))
    supported_cnt = sum(1 for c in claim_verdicts if c.get("claim_label") == "supported")
    outdated_cnt = sum(1 for c in claim_verdicts if c.get("claim_label") == "outdated")
    unsupported_cnt = sum(1 for c in claim_verdicts if c.get("claim_label") == "unsupported")

    summary = {
        "total_visual_violations": len(visual_findings),
        "total_claims_extracted": len(extracted_claims),
        "supported_claims": supported_cnt,
        "outdated_claims": outdated_cnt,
        "unsupported_claims": unsupported_cnt,
        "privacy_blurs_applied": len(blurred_elements),
        "privacy_shield_status": "Active" if redaction_applied else "Clear (No PII Detected)",
        "compliance_grade": "A" if compliance_score >= 85 else ("B" if compliance_score >= 70 else "C")
    }

    return MultimodalCheckResponse(
        image_name=clean_name,
        agency=req.agency or "Internal Creative Studio",
        redacted_url=redacted_url,
        redaction_applied=redaction_applied,
        blurred_elements=blurred_elements,
        audit_meta=audit_meta,
        ocr_text=extracted_text,
        extracted_claims=extracted_claims,
        claim_verdicts=claim_verdicts,
        visual_findings=visual_findings,
        visual_compliance_score=round(compliance_score, 1),
        summary=summary
    )

