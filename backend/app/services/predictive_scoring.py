import re
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.source import GlossaryTerm, SourceChunk
from app.models.workspace import Workspace
from app.checks.banned_terms import check_banned_terms
from app.checks.claim_patterns import check_claim_patterns
from app.checks.readability import calculate_readability
from app.checks.contrast import evaluate_contrast_ratio
from app.ai.redaction import redact_sensitive_data
from app.config import settings

def calculate_predictive_compliance_score(
    text: str,
    db: Optional[Session] = None,
    workspace_id: Optional[str] = None,
    target_ease: Optional[float] = 60.0,
    color_pairs: Optional[List[Dict[str, Any]]] = None,
    images: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Evaluates text (and optional visual assets) across 5 governance vectors
    to predict comprehensive pre-publish compliance probability and approval turnaround.
    """
    clean_text = text or ""
    effective_target_ease = target_ease or settings.DEFAULT_READABILITY_TARGET

    # 1. Fetch workspace glossary if DB available
    glossary_terms: List[Any] = []
    if db and workspace_id:
        glossary_terms = db.query(GlossaryTerm).filter(GlossaryTerm.workspace_id == workspace_id).all()
    elif db:
        first_ws = db.query(Workspace).first()
        if first_ws:
            glossary_terms = db.query(GlossaryTerm).filter(GlossaryTerm.workspace_id == first_ws.id).all()

    # --- VECTOR 1: Terminology & Glossary Governance (25%) ---
    term_findings = check_banned_terms(clean_text, glossary_terms) if glossary_terms else []
    banned_count = sum(1 for f in term_findings if "banned" in f.get("rule", "").lower())
    required_missing_count = sum(1 for f in term_findings if "required" in f.get("rule", "").lower())

    term_penalty = (banned_count * 25.0) + (required_missing_count * 15.0)
    term_score = max(0.0, min(100.0, 100.0 - term_penalty))
    term_status = "pass" if term_score >= 85 else "warning" if term_score >= 60 else "fail"
    term_summary = (
        "100% compliant with approved workspace glossary."
        if not term_findings
        else f"{banned_count} banned term(s) and {required_missing_count} missing term(s) detected."
    )

    # --- VECTOR 2: Factual Grounding & Claims Freshness (25%) ---
    claim_findings = check_claim_patterns(clean_text)
    claim_count = len(claim_findings)
    unbacked_superlatives = sum(1 for f in claim_findings if "world's best" in f.get("rule", "").lower() or "#1" in f.get("rule", ""))
    guarantee_claims = sum(1 for f in claim_findings if "guarantee" in f.get("rule", "").lower() or "risk" in f.get("rule", "").lower())

    claim_penalty = (unbacked_superlatives * 20.0) + (guarantee_claims * 25.0) + (max(0, claim_count - unbacked_superlatives - guarantee_claims) * 15.0)
    claim_score = max(0.0, min(100.0, 100.0 - claim_penalty))
    claim_status = "pass" if claim_score >= 85 else "warning" if claim_score >= 60 else "fail"
    claim_summary = (
        "All assertions conform to grounded factual guidelines."
        if not claim_findings
        else f"{claim_count} unverified claim or absolute superlative assertion(s) flagged."
    )

    # --- VECTOR 3: Brand Voice & Tone Integrity (20%) ---
    readability = calculate_readability(clean_text, effective_target_ease)
    ease_diff = readability.get("flesch_reading_ease", 60.0) - effective_target_ease
    
    # Penalize if reading ease is way below target (too dense / academic)
    if ease_diff >= 0:
        tone_score = 100.0
    elif ease_diff >= -10:
        tone_score = 85.0
    elif ease_diff >= -25:
        tone_score = 65.0
    else:
        tone_score = 40.0

    # Extra penalty for hyperbole density
    hyperbole_words = ["insane", "miracle", "revolutionary", "game-changing", "unbelievable"]
    hyperbole_count = sum(len(re.findall(rf"\b{w}\b", clean_text, re.IGNORECASE)) for w in hyperbole_words)
    tone_score = max(0.0, tone_score - (hyperbole_count * 15.0))
    tone_status = "pass" if tone_score >= 80 else "warning" if tone_score >= 60 else "fail"
    tone_summary = (
        f"Flesch Reading Ease {readability.get('flesch_reading_ease', 60.0):.1f} aligns with target {effective_target_ease:.0f}."
        if ease_diff >= -5 and hyperbole_count == 0
        else f"Reading ease ({readability.get('flesch_reading_ease', 60.0):.1f}) deviates from standard ({effective_target_ease:.0f}); {hyperbole_count} hyperbole term(s)."
    )

    # --- VECTOR 4: Accessibility & WCAG Compliance (15%) ---
    access_score = 100.0
    access_issues = []

    # Check color pairs if provided
    if color_pairs:
        for idx, cp in enumerate(color_pairs):
            fg = cp.get("foreground", "#000000")
            bg = cp.get("background", "#FFFFFF")
            res = evaluate_contrast_ratio(fg, bg, cp.get("font_size", "normal"))
            if not res.get("passes_aa"):
                access_score -= 25.0
                access_issues.append(f"Pair #{idx+1} ({fg}/{bg}) fails WCAG AA ({res.get('contrast_ratio', 0.0)}:1)")

    # Check alt texts on images if provided
    if images:
        for img in images:
            alt = img.get("alt_text", "")
            if not alt or alt.lower() in ["image", "photo", "banner", "pic"]:
                access_score -= 15.0
                access_issues.append(f"Generic or missing alt text on '{img.get('name', 'image')}'")

    # Word wall check (long text without line breaks)
    if len(clean_text) > 400 and "\n" not in clean_text:
        access_score -= 15.0
        access_issues.append("Unbroken wall of text lacks readable paragraph spacing.")

    access_score = max(0.0, min(100.0, access_score))
    access_status = "pass" if access_score >= 85 else "warning" if access_score >= 60 else "fail"
    access_summary = (
        "Meets WCAG AA accessibility & plain English readability criteria."
        if not access_issues
        else "; ".join(access_issues[:2])
    )

    # --- VECTOR 5: Legal, Regulatory & Privacy Safety (15%) ---
    _, has_redaction, redactions_summary, _ = redact_sensitive_data(clean_text)
    api_key_leaks = sum(1 for r in redactions_summary if "API_KEY" in r.get("placeholder", "") or "SECRET" in r.get("placeholder", ""))
    pii_leaks = len(redactions_summary) - api_key_leaks

    legal_penalty = (api_key_leaks * 50.0) + (pii_leaks * 25.0)
    legal_score = max(0.0, min(100.0, 100.0 - legal_penalty))
    legal_status = "pass" if legal_score >= 85 else "warning" if legal_score >= 60 else "fail"
    legal_summary = (
        "Zero confidential credentials, tokens, or exposed PII detected."
        if not redactions_summary
        else f"{api_key_leaks} credential leak(s) and {pii_leaks} sensitive PII item(s) detected!"
    )

    # --- AGGREGATE PREDICTIVE SCORE ---
    overall_score = (
        (term_score * 0.25) +
        (claim_score * 0.25) +
        (tone_score * 0.20) +
        (access_score * 0.15) +
        (legal_score * 0.15)
    )
    overall_score = round(max(0.0, min(100.0, overall_score)), 1)

    # Letter Grade
    if overall_score >= 94:
        grade = "A+"
        risk_level = "low"
    elif overall_score >= 88:
        grade = "A"
        risk_level = "low"
    elif overall_score >= 80:
        grade = "B+"
        risk_level = "low"
    elif overall_score >= 72:
        grade = "B"
        risk_level = "medium"
    elif overall_score >= 65:
        grade = "C"
        risk_level = "medium"
    elif overall_score >= 50:
        grade = "D"
        risk_level = "high"
    else:
        grade = "F"
        risk_level = "high"

    # Approval Probability Prediction
    # Severe leaks or banned terms cap approval probability
    if api_key_leaks > 0 or banned_count > 1 or guarantee_claims > 0:
        approval_prob = min(0.40, overall_score / 100.0 * 0.5)
    elif overall_score >= 85:
        approval_prob = min(0.98, 0.85 + (overall_score - 85) * 0.008)
    else:
        approval_prob = max(0.15, overall_score / 100.0 * 0.9)
    approval_prob = round(approval_prob, 2)

    # Turnaround Forecast
    if overall_score >= 88:
        est_minutes = 3.5
        gate_forecast = "direct_approval"
        required_reviewers = ["brand_manager"]
    elif overall_score >= 70:
        est_minutes = 12.0
        gate_forecast = "manager_review"
        required_reviewers = ["brand_manager"]
    else:
        est_minutes = 45.0
        gate_forecast = "legal_escalation"
        required_reviewers = ["brand_manager", "reviewer"]

    if api_key_leaks > 0 or pii_leaks > 0 or guarantee_claims > 0:
        if "reviewer" not in required_reviewers:
            required_reviewers.append("reviewer")
        gate_forecast = "legal_escalation"

    # Positives & Risks
    positives = []
    if term_score >= 95:
        positives.append("100% compliant terminology with zero banned glossary terms")
    if claim_score >= 95:
        positives.append("Clean assertion grounding with zero unsubstantiated superlatives")
    if legal_score >= 95:
        positives.append("Zero confidential credentials, tokens, or unmasked PII")
    if readability.get("passes_target", False):
        positives.append(f"Clear plain English readability score ({readability.get('flesch_reading_ease', 60.0):.1f})")
    if not positives:
        positives.append("Content structure provides a solid base for compliant revision.")

    risks = []
    if banned_count > 0:
        risks.append(f"{banned_count} prohibited glossary term(s) will trigger automatic reviewer rejection")
    if guarantee_claims > 0:
        risks.append("Prohibited absolute guarantee assertions trigger mandatory Legal escalation")
    if unbacked_superlatives > 0:
        risks.append(f"{unbacked_superlatives} unqualified '#1' or 'world's best' superlative(s) violate claims policy")
    if api_key_leaks > 0 or pii_leaks > 0:
        risks.append("Sensitive confidential credentials or PII detected in draft copy")
    if ease_diff < -15:
        risks.append("Complex sentence structure impedes general comprehension")
    if not risks:
        risks.append("No critical compliance blockers detected. Safe for submission.")

    # Actionable Recommendations
    recommendations = []
    if banned_count > 0:
        recommendations.append(f"Use AI Auto-Rewrite to replace {banned_count} banned term(s) (+{banned_count * 15}% boost)")
    if unbacked_superlatives > 0 or guarantee_claims > 0:
        recommendations.append("Qualify superlatives with approved fact sheet benchmark citations (+12% boost)")
    if api_key_leaks > 0 or pii_leaks > 0:
        recommendations.append("Apply automated zero-exposure privacy redaction to strip confidential tokens")
    if ease_diff < -10:
        recommendations.append("Break long sentences into concise 15-word statements to increase readability")
    if not recommendations:
        recommendations.append("Draft exceeds governance targets. Ready to submit for 1-click Brand Manager approval!")

    dimensions = [
        {
            "category": "terminology",
            "label": "Glossary & Terminology",
            "score": round(term_score, 1),
            "status": term_status,
            "weight": 0.25,
            "findings_count": len(term_findings),
            "summary": term_summary
        },
        {
            "category": "claims",
            "label": "Factual Grounding & Claims",
            "score": round(claim_score, 1),
            "status": claim_status,
            "weight": 0.25,
            "findings_count": len(claim_findings),
            "summary": claim_summary
        },
        {
            "category": "tone",
            "label": "Brand Voice & Tone",
            "score": round(tone_score, 1),
            "status": tone_status,
            "weight": 0.20,
            "findings_count": hyperbole_count,
            "summary": tone_summary
        },
        {
            "category": "accessibility",
            "label": "Accessibility & WCAG",
            "score": round(access_score, 1),
            "status": access_status,
            "weight": 0.15,
            "findings_count": len(access_issues),
            "summary": access_summary
        },
        {
            "category": "legal_privacy",
            "label": "Legal & Privacy Safety",
            "score": round(legal_score, 1),
            "status": legal_status,
            "weight": 0.15,
            "findings_count": len(redactions_summary),
            "summary": legal_summary
        }
    ]

    total_violations = len(term_findings) + len(claim_findings) + hyperbole_count + len(access_issues) + len(redactions_summary)

    return {
        "overall_score": overall_score,
        "grade": grade,
        "risk_level": risk_level,
        "approval_probability": approval_prob,
        "estimated_turnaround_minutes": est_minutes,
        "gate_forecast": gate_forecast,
        "required_reviewers": required_reviewers,
        "dimensions": dimensions,
        "top_positives": positives,
        "top_risks": risks,
        "actionable_recommendations": recommendations,
        "readability_metrics": readability,
        "detected_violations_count": total_violations
    }
