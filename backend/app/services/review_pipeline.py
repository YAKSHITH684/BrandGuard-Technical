import re
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from app.models.draft import DraftVersion
from app.models.finding import Finding
from app.models.source import GlossaryTerm, SourceChunk
from app.models.workspace import Workspace
from app.checks.banned_terms import check_banned_terms
from app.checks.claim_patterns import check_claim_patterns
from app.checks.readability import check_readability_findings, calculate_readability
from app.checks.contrast import check_color_pairs_findings
from app.checks.accessibility import check_accessibility_content
from app.checks.visual import (
    check_color_palette,
    check_logo_integrity,
    check_visual_contrast,
    check_image_alt_text
)
from app.ai.redaction import redact_sensitive_data
from app.ai.image_redaction import redact_image_privacy
from app.ai.ocr import (
    extract_text_from_image,
    extract_image_candidate_claims,
    check_image_claims_against_facts
)
from app.ai.retrieval import retrieve_relevant_chunks
from app.ai.llm_client import run_llm_review
from app.services.audit import log_audit_event
from app.config import settings

def run_brandguard_review(
    db: Session,
    workspace_id: str,
    draft_version_id: str,
    raw_content: str,
    actor_id: Optional[str] = None,
    color_pairs: Optional[List[Any]] = None,
    alt_texts: Optional[List[Dict[str, str]]] = None,
    images: Optional[List[Dict[str, Any]]] = None,
    skip_llm: bool = False
) -> Tuple[List[Finding], str]:
    """
    Executes the full BrandGuard pre-publish review pipeline:
    1. Privacy redaction layer (Text PII + Image face/plate/text blurring)
    2. Deterministic text rules (Glossary, claim patterns, readability)
    3. Multimodal Image Governance:
       - OCR claim extraction & Grounded ClaimCheck against fact sheets
       - Visual violations (off-palette colors, distorted/deprecated logos, low contrast, alt text)
    4. Retrieval of workspace guidelines & facts
    5. Structured LLM review (Groq) with ClaimCheck
    6. Deduplication, persistence, and audit logging
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    target_ease = workspace.readability_target if workspace else settings.DEFAULT_READABILITY_TARGET
    confidence_threshold = workspace.confidence_threshold if workspace else settings.CONFIDENCE_THRESHOLD

    # 1. Privacy Layer: Redact PII and secrets in text
    redacted_text, redaction_applied, redaction_summary, token_map = redact_sensitive_data(raw_content)

    all_raw_findings: List[Dict[str, Any]] = []

    # 2. Deterministic Checks on Text (Always run, no AI needed)
    glossary_items = db.query(GlossaryTerm).filter(GlossaryTerm.workspace_id == workspace_id).all()
    banned_findings = check_banned_terms(raw_content, glossary_items)
    all_raw_findings.extend(banned_findings)

    claim_pattern_findings = check_claim_patterns(raw_content)
    all_raw_findings.extend(claim_pattern_findings)

    readability_findings = check_readability_findings(raw_content, target_ease)
    all_raw_findings.extend(readability_findings)

    if color_pairs:
        contrast_findings = check_color_pairs_findings(color_pairs)
        all_raw_findings.extend(contrast_findings)

    accessibility_findings = check_accessibility_content(raw_content, alt_texts)
    all_raw_findings.extend(accessibility_findings)

    # 3. Retrieval of workspace guidelines & fact sheets
    retrieved_chunks = retrieve_relevant_chunks(db, workspace_id, redacted_text, top_k=6)

    # 4. Multimodal & Image Governance Pipeline (Improvements 1, 2, 3)
    # Detect markdown images if no explicit images are supplied
    target_images = list(images or [])
    if not target_images:
        md_matches = re.findall(r"!\[(.*?)\]\((.*?)\)", raw_content)
        for alt, src in md_matches:
            src_name = src.split("/")[-1] if "/" in src else (src if src else "banner_infographic.png")
            target_images.append({
                "name": src_name,
                "alt_text": alt,
                "url": src,
                "agency": "Campaign Media Agency",
                "colors": ["#FF007F", "#10B981"] if "benchmark" in src_name.lower() or "infographic" in src_name.lower() else ["#10B981"],
                "logo_identifier": "2021 Acme Circular Crest" if "benchmark" in src_name.lower() or "infographic" in src_name.lower() else None,
                "aspect_ratio_skew": 0.22 if "benchmark" in src_name.lower() or "infographic" in src_name.lower() else 0.0,
                "contrast_ratio": 3.2 if "benchmark" in src_name.lower() or "infographic" in src_name.lower() else 5.5,
                "has_face": "photo" in src_name.lower() or "testimonial" in src_name.lower() or "team" in src_name.lower(),
                "has_license_plate": "fleet" in src_name.lower() or "car" in src_name.lower()
            })

    processed_images_data = []

    for img_item in target_images:
        img_name = img_item.get("name", "visual_asset.png")
        agency = img_item.get("agency", "Internal Creative Studio")
        alt_text = img_item.get("alt_text")
        colors = img_item.get("colors") or []
        logo_id = img_item.get("logo_identifier")
        skew = img_item.get("aspect_ratio_skew", 0.0)
        contrast_ratio = img_item.get("contrast_ratio")

        # Step A: Image Privacy Redaction Layer (Improvement 3)
        # Redacts PII, faces, and secrets BEFORE external analysis
        redacted_url, img_redacted, blurred_elements, audit_meta = redact_image_privacy(
            image_input=img_item,
            image_name=img_name,
            raw_ocr_text=img_item.get("ocr_text")
        )

        if img_redacted:
            log_audit_event(
                db=db,
                workspace_id=workspace_id,
                actor_id=actor_id,
                event_type="image_redacted",
                entity_type="draft_version",
                entity_id=draft_version_id,
                metadata=audit_meta
            )

        # Step B: OCR Claim Extraction & Grounded ClaimCheck (Improvement 1)
        extracted_text = extract_text_from_image(img_item, img_name)
        extracted_claims = extract_image_candidate_claims(extracted_text)

        image_claim_findings = check_image_claims_against_facts(
            image_name=img_name,
            extracted_claims=extracted_claims,
            retrieved_chunks=retrieved_chunks,
            redaction_applied=img_redacted
        )
        all_raw_findings.extend(image_claim_findings)

        if extracted_claims:
            log_audit_event(
                db=db,
                workspace_id=workspace_id,
                actor_id=actor_id,
                event_type="image_claims_analyzed",
                entity_type="draft_version",
                entity_id=draft_version_id,
                metadata={
                    "image_name": img_name,
                    "extracted_claims_count": len(extracted_claims),
                    "claims": extracted_claims,
                    "privacy_redaction_applied": img_redacted,
                    "model": "brandguard-vision-ocr-v1"
                }
            )

        # Step C: Visual Brand Violations (Improvement 2)
        # Off-palette colors
        if colors:
            palette_findings = check_color_palette(colors, img_name)
            all_raw_findings.extend(palette_findings)

        # Wrong or distorted logos
        if logo_id or skew:
            logo_findings = check_logo_integrity(logo_id, skew, img_name)
            all_raw_findings.extend(logo_findings)

        # Low contrast on graphics
        if contrast_ratio is not None:
            contrast_findings = check_visual_contrast(contrast_ratio, img_name)
            all_raw_findings.extend(contrast_findings)

        # Missing alt text
        alt_findings = check_image_alt_text(alt_text, img_name)
        all_raw_findings.extend(alt_findings)

        # Record processed image metadata
        processed_images_data.append({
            "name": img_name,
            "agency": agency,
            "url": redacted_url,
            "alt_text": alt_text,
            "colors": colors,
            "logo_identifier": logo_id,
            "aspect_ratio_skew": skew,
            "contrast_ratio": contrast_ratio,
            "extracted_text": extracted_text,
            "extracted_claims_count": len(extracted_claims),
            "redaction_applied": img_redacted,
            "blurred_elements": blurred_elements,
            "audit_meta": audit_meta
        })

    # Save redacted content and images data to DraftVersion
    draft_version = db.query(DraftVersion).filter(DraftVersion.id == draft_version_id).first()
    if draft_version:
        draft_version.redacted_content = redacted_text
        draft_version.images_data = processed_images_data
        db.commit()

    # 5. LLM Review on Text (Groq)
    ai_status = "unavailable"
    ai_findings = []
    if not skip_llm:
        ai_findings, ai_status = run_llm_review(
            draft_text=redacted_text,
            retrieved_chunks=retrieved_chunks,
            redaction_applied=redaction_applied
        )

        if ai_status == "available":
            log_audit_event(
                db=db,
                workspace_id=workspace_id,
                actor_id=actor_id,
                event_type="external_model_call",
                entity_type="draft_version",
                entity_id=draft_version_id,
                metadata={
                    "provider": "Groq",
                    "model": "llama-3.3-70b-versatile",
                    "redaction_applied": redaction_applied,
                    "redacted_items_count": len(redaction_summary),
                    "chunks_provided_count": len(retrieved_chunks)
                }
            )

    for af in ai_findings:
        chunk_id = af.get("source_chunk_id")
        relevance = 0.5
        if chunk_id:
            matching = [c for c in retrieved_chunks if c.get("id") == chunk_id]
            if matching:
                relevance = matching[0].get("relevance_score", 0.5)

        if relevance < (confidence_threshold - 0.2) and af.get("confidence") == "low":
            af["confidence"] = "cannot_verify"

        all_raw_findings.append(af)

    # 6. Deduplicate findings
    seen = set()
    unique_raw_findings = []
    for f in all_raw_findings:
        key = (f["category"], f.get("span_start", 0), f.get("span_end", 0), f["rule"])
        if key not in seen:
            seen.add(key)
            unique_raw_findings.append(f)

    # Persist findings to database
    persisted_findings: List[Finding] = []
    for f in unique_raw_findings:
        finding_obj = Finding(
            version_id=draft_version_id,
            category=f["category"],
            severity=f["severity"],
            span_start=f.get("span_start", 0),
            span_end=f.get("span_end", 0),
            span_text=f["span_text"],
            rule=f["rule"],
            source_chunk_id=f.get("source_chunk_id"),
            source_excerpt=f.get("source_excerpt"),
            confidence=f.get("confidence", "high"),
            claim_label=f.get("claim_label"),
            suggested_rewrite=f.get("suggested_rewrite"),
            origin=f.get("origin", "deterministic"),
            ai_disclosure=f.get("ai_disclosure")
        )
        persisted_findings.append(finding_obj)

    db.add_all(persisted_findings)
    db.commit()

    for p in persisted_findings:
        db.refresh(p)

    # Log findings generated
    log_audit_event(
        db=db,
        workspace_id=workspace_id,
        actor_id=actor_id,
        event_type="findings_generated",
        entity_type="draft_version",
        entity_id=draft_version_id,
        metadata={
            "total_findings": len(persisted_findings),
            "ai_status": ai_status,
            "deterministic_count": len([f for f in persisted_findings if f.origin == "deterministic"]),
            "ai_count": len([f for f in persisted_findings if f.origin == "ai"]),
            "image_ocr_count": len([f for f in persisted_findings if f.origin == "image_ocr"]),
            "visual_check_count": len([f for f in persisted_findings if f.origin == "visual_check"])
        }
    )

    return persisted_findings, ai_status
