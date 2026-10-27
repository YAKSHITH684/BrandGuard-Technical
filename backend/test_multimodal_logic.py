import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, init_db
from app.models.workspace import Workspace
from app.models.user import User
from app.models.draft import Draft, DraftVersion
from app.models.finding import Finding
from app.models.audit import AuditLog
from app.checks.visual import (
    check_color_palette,
    check_logo_integrity,
    check_visual_contrast,
    check_image_alt_text
)
from app.ai.image_redaction import redact_image_privacy
from app.ai.ocr import (
    extract_text_from_image,
    extract_image_candidate_claims,
    check_image_claims_against_facts
)
from app.services.review_pipeline import run_brandguard_review
from app.services.insights import get_insights_summary

def run_tests():
    print("=" * 60)
    print("BRANDGUARD MULTIMODAL VERIFICATION TEST SUITE")
    print("=" * 60)

    db = SessionLocal()
    ws = db.query(Workspace).first()
    creator = db.query(User).filter(User.role == "creator").first()
    print(f"[PASS] Connected to DB. Active Workspace: '{ws.name}'")

    # 1. Improvement 1: ClaimCheck (Text and Images)
    print("\n--- Testing Improvement 1: ClaimCheck (Text & Images) ---")
    raw_graphic_text = (
        "Acme LiveSync 2.0. "
        "Delivers 99.999% uptime guaranteed with zero downtime. "
        "Rated #1 Cloud Platform in 2023 Benchmark study. "
        "Processes 2.4 million events per second across 12 regions."
    )
    claims = extract_image_candidate_claims(raw_graphic_text)
    print(f"[PASS] Extracted {len(claims)} candidate claims from graphic text via OCR")
    for idx, c in enumerate(claims, 1):
        print(f"   Claim {idx}: \"{c}\"")

    retrieved_fact_chunks = [
        {
            "id": "fact-chunk-sla-01",
            "content": "Acme Verified Fact Sheet (Section 2.1): Acme cloud infrastructure maintains a verified 99.85% historical uptime SLA across primary availability zones."
        },
        {
            "id": "fact-chunk-bench-02",
            "content": "Acme Fact Sheet (Section 3.4): 2023 Independent Streaming Benchmark expired on December 31, 2024. All claims referencing the 2023 study are superseded."
        },
        {
            "id": "fact-chunk-events-03",
            "content": "Acme Verified Fact Sheet (Section 1.2): Acme LiveSync processes 2.4 million events per second with sub-5ms latency across 12 regions."
        }
    ]

    claim_verdicts = check_image_claims_against_facts(
        image_name="infographic_banner.png",
        extracted_claims=claims,
        retrieved_chunks=retrieved_fact_chunks,
        redaction_applied=True
    )

    unsupported_claims = [c for c in claim_verdicts if c["claim_label"] == "unsupported"]
    outdated_claims = [c for c in claim_verdicts if c["claim_label"] == "outdated"]
    supported_claims = [c for c in claim_verdicts if c["claim_label"] == "supported"]

    assert len(unsupported_claims) >= 1, "Expected unsupported claim for 99.999% guarantee"
    assert len(outdated_claims) >= 1, "Expected outdated claim for 2023 benchmark"
    assert len(supported_claims) >= 1, "Expected supported claim for 2.4M events/sec"

    print(f"[PASS] ClaimCheck Grounded Verdicts on Image Claims:")
    print(f"   * Unsupported ({len(unsupported_claims)}): \"{unsupported_claims[0]['span_text']}\" -> {unsupported_claims[0]['rule']}")
    print(f"   * Outdated ({len(outdated_claims)}): \"{outdated_claims[0]['span_text']}\" -> {outdated_claims[0]['rule']}")
    print(f"   * Supported ({len(supported_claims)}): \"{supported_claims[0]['span_text']}\" -> {supported_claims[0]['rule']}")

    # 2. Improvement 2: Insights (Including Visual Violations)
    print("\n--- Testing Improvement 2: Insights (Visual Violations) ---")
    palette_findings = check_color_palette(["#FF007F", "#10B981"], "infographic_banner.png")
    assert len(palette_findings) == 1
    assert "Off-Palette" in palette_findings[0]["rule"]
    print(f"[PASS] Off-palette color detected: {palette_findings[0]['rule']}")

    logo_findings = check_logo_integrity("2021 Acme Circular Crest", aspect_ratio_skew=0.22, image_name="infographic_banner.png")
    assert len(logo_findings) == 2
    assert "Deprecated Logo" in logo_findings[0]["rule"]
    assert "Distorted Logo" in logo_findings[1]["rule"]
    print(f"[PASS] Logo violations detected: {logo_findings[0]['rule']} & {logo_findings[1]['rule']}")

    contrast_findings = check_visual_contrast(3.2, "infographic_banner.png")
    assert len(contrast_findings) == 1
    print(f"[PASS] Low graphic contrast detected: {contrast_findings[0]['rule']}")

    alt_findings = check_image_alt_text("banner", "infographic_banner.png")
    assert len(alt_findings) == 1
    print(f"[PASS] Generic alt text detected: {alt_findings[0]['rule']}")

    # Insights summary aggregation
    summary = get_insights_summary(db, ws.id)
    assert "visual_insights" in summary
    vis_data = summary["visual_insights"]
    assert vis_data["total_visual_violations"] > 0
    assert len(vis_data["breakdown"]) == 4
    assert len(vis_data["recurring_mistakes"]) > 0
    print(f"[PASS] Insights aggregation: {vis_data['total_visual_violations']} visual violations tracked")
    print(f"   * Visual Compliance Score: {vis_data['visual_compliance_score']}%")
    print(f"   * Recurring Agency Mistakes Tracked: {len(vis_data['recurring_mistakes'])}")
    for rm in vis_data["recurring_mistakes"]:
        print(f"     - [{rm['agency_or_asset']}] {rm['violation_type']} (Freq: {rm['frequency']}) -> {rm['recommendation']}")

    # 3. Improvement 3: Privacy Layer (Covering Images)
    print("\n--- Testing Improvement 3: Privacy Layer (Covering Images) ---")
    test_img_input = {
        "url": None,
        "has_face": True,
        "has_license_plate": False,
        "text": "Call Alex Vance at 415-555-0199 or email alex.vance@acmecorp.internal with API key gsk_live_secret_key_88921"
    }
    redacted_url, applied, blurred_elements, audit_meta = redact_image_privacy(
        test_img_input,
        image_name="alex_vance_photo.png",
        raw_ocr_text=test_img_input["text"]
    )
    assert applied is True
    assert len(blurred_elements) >= 2
    face_elements = [e for e in blurred_elements if e["type"] == "FACE"]
    text_elements = [e for e in blurred_elements if e["type"] == "CONFIDENTIAL_TEXT"]
    assert len(face_elements) == 1, "Face likeness was not blurred"
    assert len(text_elements) >= 1, "Confidential text was not blurred"
    print(f"[PASS] Privacy redaction applied: Irreversibly blurred {len(blurred_elements)} sensitive elements:")
    for b in blurred_elements:
        print(f"   * [{b['type']}] {b['label']} (Confidence: {b['confidence']}, Action: {b['action']})")

    assert audit_meta["faces_blurred_count"] == 1
    assert audit_meta["confidential_text_blurred_count"] >= 1
    print(f"[PASS] Audit Metadata prepared: {audit_meta}")

    # Check seeded Draft E in database
    d5 = db.query(Draft).filter(Draft.title.like("%Multimodal%")).first()
    assert d5 is not None
    v5 = d5.versions[0]
    findings_v5 = db.query(Finding).filter(Finding.version_id == v5.id).all()
    assert len(findings_v5) >= 6
    print(f"[PASS] Pre-seeded Multimodal Draft '{d5.title}' has {len(findings_v5)} persisted findings:")
    for f in findings_v5:
        print(f"   - [{f.category:13} | {f.origin:12} | label: {str(f.claim_label):11}] {f.rule[:45]}")

    audit_logs_v5 = db.query(AuditLog).filter(AuditLog.entity_id == v5.id).all()
    assert len(audit_logs_v5) >= 3
    print(f"[PASS] Persisted Immutable Audit Trail ({len(audit_logs_v5)} records):")
    for a in audit_logs_v5:
        print(f"   * Event: {a.event_type:22} | Meta: {str(a.log_metadata)[:70]}...")

    db.close()
    print("\n" + "=" * 60)
    print("ALL 3 IMPROVEMENTS VERIFIED AND FULLY PASSING IN BACKEND!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
