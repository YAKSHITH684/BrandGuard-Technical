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
from app.ai.redaction import redact_sensitive_data
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
    alt_texts: Optional[List[Dict[str, str]]] = None
) -> Tuple[List[Finding], str]:
    """
    Executes the full BrandGuard pre-publish review pipeline:
    1. Privacy redaction layer
    2. Deterministic rules
    3. Retrieval of workspace guidelines & facts
    4. Structured LLM review (Groq) with ClaimCheck
    5. Deduplication and persistence
    """
    workspace = db.query(Workspace).filter(Workspace.id == workspace_id).first()
    target_ease = workspace.readability_target if workspace else settings.DEFAULT_READABILITY_TARGET
    confidence_threshold = workspace.confidence_threshold if workspace else settings.CONFIDENCE_THRESHOLD

    # 1. Privacy Layer: Redact PII and secrets
    redacted_text, redaction_applied, redaction_summary, token_map = redact_sensitive_data(raw_content)

    # Save redacted content to DraftVersion
    draft_version = db.query(DraftVersion).filter(DraftVersion.id == draft_version_id).first()
    if draft_version:
        draft_version.redacted_content = redacted_text
        db.commit()

    all_raw_findings: List[Dict[str, Any]] = []

    # 2. Deterministic Checks (Always run, no AI needed)
    # A. Glossary terms (banned & required)
    glossary_items = db.query(GlossaryTerm).filter(GlossaryTerm.workspace_id == workspace_id).all()
    banned_findings = check_banned_terms(raw_content, glossary_items)
    all_raw_findings.extend(banned_findings)

    # B. Claim patterns (superlatives, absolutes, unqualified percentages)
    claim_pattern_findings = check_claim_patterns(raw_content)
    all_raw_findings.extend(claim_pattern_findings)

    # C. Readability score
    readability_findings = check_readability_findings(raw_content, target_ease)
    all_raw_findings.extend(readability_findings)

    # D. WCAG Color Contrast
    if color_pairs:
        contrast_findings = check_color_pairs_findings(color_pairs)
        all_raw_findings.extend(contrast_findings)

    # E. Accessibility (link text & alt text)
    accessibility_findings = check_accessibility_content(raw_content, alt_texts)
    all_raw_findings.extend(accessibility_findings)

    # 3. Retrieval
    retrieved_chunks = retrieve_relevant_chunks(db, workspace_id, redacted_text, top_k=5)

    # 4. LLM Review (Groq)
    ai_status = "unavailable"
    ai_findings, ai_status = run_llm_review(
        draft_text=redacted_text,
        retrieved_chunks=retrieved_chunks,
        redaction_applied=redaction_applied
    )

    # Log external model call in audit log
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

    # Filter AI findings against confidence threshold: below threshold -> cannot_verify
    for af in ai_findings:
        # Check relevance of cited chunk
        chunk_id = af.get("source_chunk_id")
        relevance = 0.5
        if chunk_id:
            matching = [c for c in retrieved_chunks if c.get("id") == chunk_id]
            if matching:
                relevance = matching[0].get("relevance_score", 0.5)

        if relevance < (confidence_threshold - 0.2) and af.get("confidence") == "low":
            af["confidence"] = "cannot_verify"

        all_raw_findings.append(af)

    # Deduplicate findings by (category, span_start, span_end, rule)
    seen = set()
    unique_raw_findings = []
    for f in all_raw_findings:
        key = (f["category"], f["span_start"], f["span_end"], f["rule"])
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
            span_start=f["span_start"],
            span_end=f["span_end"],
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
            "ai_count": len([f for f in persisted_findings if f.origin == "ai"])
        }
    )

    return persisted_findings, ai_status
