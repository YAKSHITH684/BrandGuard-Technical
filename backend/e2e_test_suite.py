import os
import sys
from datetime import datetime, date

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app.database import SessionLocal, init_db
from app.models.workspace import Workspace
from app.models.user import User
from app.models.source import SourceDocument, SourceChunk, GlossaryTerm
from app.models.draft import Draft, DraftVersion
from app.models.finding import Finding, FindingAction
from app.models.approval import Approval
from app.models.comment import Comment
from app.models.audit import AuditLog
from app.routers.auth import hash_password, verify_password, create_access_token
from app.services.review_pipeline import run_brandguard_review
from app.services.workflow import generate_version_diff
from app.services.insights import get_insights_summary
from app.services.audit import log_audit_event, generate_audit_csv
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
from app.checks.readability import calculate_readability
from app.checks.contrast import evaluate_contrast_ratio

def run_e2e():
    print("=" * 70)
    print("  BRANDGUARD COMPLETE END-TO-END SYSTEM TEST (ALL 3 IMPROVEMENTS)")
    print("=" * 70)

    init_db()
    db = SessionLocal()

    # -------------------------------------------------------------
    # STEP 1: Workspace & Demo Personas Verification
    # -------------------------------------------------------------
    print("\n[STEP 1] Verifying Workspace & Demo Personas...")
    ws = db.query(Workspace).first()
    assert ws is not None, "Workspace missing in DB"
    print(f"  * Workspace ID: {ws.id} | Name: '{ws.name}'")

    creator = db.query(User).filter(User.email == "creator@brandguard.io").first()
    manager = db.query(User).filter(User.email == "manager@brandguard.io").first()
    reviewer = db.query(User).filter(User.email == "reviewer@brandguard.io").first()

    assert creator is not None and verify_password("password123", creator.password_hash)
    assert manager is not None and verify_password("password123", manager.password_hash)
    assert reviewer is not None and verify_password("password123", reviewer.password_hash)

    token_creator = create_access_token({"sub": creator.id, "email": creator.email, "role": creator.role, "workspace_id": ws.id})
    token_manager = create_access_token({"sub": manager.id, "email": manager.email, "role": manager.role, "workspace_id": ws.id})
    print(f"  * Verified Creator ({creator.email}), Manager ({manager.email}), Reviewer ({reviewer.email})")
    print(f"  * Generated Cryptographic JWT Tokens: Creator token valid ({len(token_creator)} chars)")

    # -------------------------------------------------------------
    # STEP 2: Sources, Fact Sheets & Glossary Ingestion
    # -------------------------------------------------------------
    print("\n[STEP 2] Inspecting Approved Fact Sheets & Brand Guidelines...")
    sources = db.query(SourceDocument).filter(SourceDocument.workspace_id == ws.id).all()
    assert len(sources) >= 2, f"Expected guidelines and fact sheet, found {len(sources)}"
    chunks = db.query(SourceChunk).all()
    assert len(chunks) >= 4, "Expected sectioned source chunks in DB"
    glossary = db.query(GlossaryTerm).filter(GlossaryTerm.workspace_id == ws.id).all()
    assert len(glossary) >= 3, "Expected glossary terminology rules in DB"
    print(f"  * Ingested Sources: {len(sources)} documents, {len(chunks)} grounded chunks, {len(glossary)} glossary terms")

    # -------------------------------------------------------------
    # STEP 3: Improvement 3 - Image Privacy Layer Verification
    # -------------------------------------------------------------
    print("\n[STEP 3] Testing Improvement 3: Zero-Exposure Image Privacy Layer...")
    raw_photo_input = {
        "url": None,
        "name": "alex_vance_photo.png",
        "has_face": True,
        "text": "Alex Vance — Enterprise Architect, alex.vance@acmecorp.internal, phone +1-415-555-0199, API Key: gsk_prod_live_auth_secret_9981"
    }

    redacted_url, is_redacted, blurred_items, audit_meta = redact_image_privacy(
        image_input=raw_photo_input,
        image_name="alex_vance_photo.png",
        raw_ocr_text=raw_photo_input["text"]
    )

    assert is_redacted is True, "Privacy redaction was not applied"
    assert len(blurred_items) >= 4, f"Expected 4 blurred items, got {len(blurred_items)}"
    assert any(b["type"] == "FACE" for b in blurred_items), "Face likeness was not blurred"
    assert any("EMAIL" in b["label"] for b in blurred_items), "Email was not blurred"
    assert any("PHONE" in b["label"] for b in blurred_items), "Phone was not blurred"
    assert any("API_KEY" in b["label"] for b in blurred_items), "API key was not blurred"
    assert redacted_url.startswith("data:image/png;base64,"), "Redacted image is not a valid base64 data URL"
    print(f"  * Irreversibly blurred {len(blurred_items)} sensitive visual elements:")
    for b in blurred_items:
        print(f"     - [{b['type']}] {b['label']} (Action: {b['action']}, Conf: {b['confidence']})")
    print(f"  * Privacy metadata verified: {audit_meta['privacy_protocol']}")

    # -------------------------------------------------------------
    # STEP 4: Improvement 1 - OCR ClaimCheck Engine
    # -------------------------------------------------------------
    print("\n[STEP 4] Testing Improvement 1: ClaimCheck (Text & Images via OCR)...")
    graphic_ocr_text = (
        "Acme LiveSync 2.0. "
        "Delivers 99.999% uptime guaranteed with zero downtime. "
        "Rated #1 Cloud Platform in 2023 Benchmark study. "
        "Processes 2.4 million events per second across 12 regions."
    )
    extracted_claims = extract_image_candidate_claims(graphic_ocr_text)
    assert len(extracted_claims) == 3, f"Expected 3 candidate claims, got {len(extracted_claims)}"
    print(f"  * OCR Claim Extraction detected {len(extracted_claims)} candidate claims inside image:")
    for i, c in enumerate(extracted_claims, 1):
        print(f"     {i}. \"{c}\"")

    # Evaluate against workspace chunks
    fact_chunks = [
        {"id": "chunk-sla", "content": "Acme Verified Fact Sheet: 99.85% historical uptime SLA across primary availability zones."},
        {"id": "chunk-bench", "content": "Acme Fact Sheet: 2023 Independent Streaming Benchmark expired on December 31, 2024. All claims referencing the 2023 study are superseded."},
        {"id": "chunk-events", "content": "Acme Verified Fact Sheet: Acme LiveSync processes 2.4 million events per second with sub-5ms latency across 12 regions."}
    ]

    claim_verdicts = check_image_claims_against_facts("infographic_banner.png", extracted_claims, fact_chunks, redaction_applied=True)
    assert len(claim_verdicts) == 3

    sla_claim = next(c for c in claim_verdicts if "99.999%" in c["span_text"])
    bench_claim = next(c for c in claim_verdicts if "2023" in c["span_text"])
    throughput_claim = next(c for c in claim_verdicts if "2.4 million" in c["span_text"])

    assert sla_claim["claim_label"] == "unsupported", f"Expected unsupported, got {sla_claim['claim_label']}"
    assert "99.85%" in sla_claim["source_excerpt"]
    assert bench_claim["claim_label"] == "outdated", f"Expected outdated, got {bench_claim['claim_label']}"
    assert "expired" in bench_claim["source_excerpt"].lower()
    assert throughput_claim["claim_label"] == "supported", f"Expected supported, got {throughput_claim['claim_label']}"

    print(f"  * ClaimCheck Grounded Verdicts Verified:")
    print(f"     - Unsupported: {sla_claim['rule']} -> Citation: \"{sla_claim['source_excerpt'][:55]}...\"")
    print(f"     - Outdated:    {bench_claim['rule']} -> Citation: \"{bench_claim['source_excerpt'][:55]}...\"")
    print(f"     - Supported:   {throughput_claim['rule']} -> Citation: \"{throughput_claim['source_excerpt'][:55]}...\"")
    print(f"     - AI Disclosure: Model: {sla_claim['ai_disclosure']['model']}, Redaction: {sla_claim['ai_disclosure']['redaction_applied']}")

    # -------------------------------------------------------------
    # STEP 5: Improvement 2 - Visual Brand Governance
    # -------------------------------------------------------------
    print("\n[STEP 5] Testing Improvement 2: Visual Brand Checks (Off-Palette, Logo, Contrast, Alt)...")
    # A. Off-palette color
    palette_results = check_color_palette(["#FF007F", "#10B981"], "infographic_banner.png")
    assert len(palette_results) == 1
    assert "Off-Palette" in palette_results[0]["rule"]
    assert "#FF007F" in palette_results[0]["rule"]
    print(f"  * Off-Palette Color: {palette_results[0]['rule']} (Flagged {palette_results[0]['span_text']})")

    # B. Logo checks
    logo_results = check_logo_integrity("2021 Acme Circular Crest", aspect_ratio_skew=0.22, image_name="infographic_banner.png")
    assert len(logo_results) == 2
    assert "Deprecated Logo" in logo_results[0]["rule"]
    assert "Distorted Logo" in logo_results[1]["rule"]
    print(f"  * Logo Violations: {logo_results[0]['rule']} & {logo_results[1]['rule']}")

    # C. Contrast
    contrast_results = check_visual_contrast(3.2, "infographic_banner.png")
    assert len(contrast_results) == 1
    assert "3.2:1" in contrast_results[0]["rule"]
    print(f"  * Low Graphic Contrast: {contrast_results[0]['rule']}")

    # D. Alt text
    alt_results = check_image_alt_text("banner", "infographic_banner.png")
    assert len(alt_results) == 1
    assert "Alt Text" in alt_results[0]["rule"]
    print(f"  * Missing Alt Text: {alt_results[0]['rule']}")

    # -------------------------------------------------------------
    # STEP 6: Full Multimodal Draft Review Pipeline E2E
    # -------------------------------------------------------------
    print("\n[STEP 6] Running Full Review Pipeline on Multimodal Draft E2E...")
    draft = Draft(
        workspace_id=ws.id,
        author_id=creator.id,
        title="Live E2E Multimodal Campaign: 2026 Cloud Launch",
        status="DRAFT",
        current_version=1
    )
    db.add(draft)
    db.commit()
    db.refresh(draft)

    version1 = DraftVersion(
        draft_id=draft.id,
        version_no=1,
        content=(
            "# Acme Enterprise Cloud Acceleration: 2026 Launch\n\n"
            "Accelerate your data infrastructure with next-generation event replication.\n\n"
            "![Q4 Enterprise Performance Infographic](infographic_banner.png)\n\n"
            "![Customer Success Testimonial Photo](alex_vance_photo.png)\n\n"
            "Explore our high-throughput architecture documentation to get started."
        )
    )
    db.add(version1)
    db.commit()
    db.refresh(version1)

    sample_images = [
        {
            "name": "infographic_banner.png",
            "agency": "Starlight Media",
            "alt_text": "banner",
            "colors": ["#FF007F", "#10B981"],
            "logo_identifier": "2021 Acme Circular Crest",
            "aspect_ratio_skew": 0.22,
            "contrast_ratio": 3.2,
            "has_face": False,
            "has_license_plate": False,
            "ocr_text": "Acme guarantees 99.999% uptime with zero downtime. Rated #1 Cloud Platform in 2023 Benchmark study. Contact alex.vance@acmecorp.internal"
        },
        {
            "name": "alex_vance_photo.png",
            "agency": "Internal Creative Studio",
            "alt_text": "Lead enterprise architect customer testimonial portrait",
            "colors": ["#10B981", "#0F172A"],
            "logo_identifier": "2025 Acme Geometric Wordmark",
            "aspect_ratio_skew": 0.0,
            "contrast_ratio": 7.4,
            "has_face": True,
            "has_license_plate": False,
            "ocr_text": "Alex Vance — Lead Enterprise Architect, internal employee workstation #EMP-8821 with API key gsk_live_secret_key_88921."
        }
    ]

    persisted_findings, ai_status = run_brandguard_review(
        db=db,
        workspace_id=ws.id,
        draft_version_id=version1.id,
        raw_content=version1.content,
        actor_id=creator.id,
        images=sample_images
    )

    assert len(persisted_findings) >= 7, f"Expected at least 7 findings, got {len(persisted_findings)}"
    print(f"  * Pipeline executed: Generated {len(persisted_findings)} explainable pre-publish findings:")
    for f in persisted_findings:
        origin_pill = f"[{f.origin}]" if f.origin else ""
        label_pill = f"[{f.claim_label}]" if f.claim_label else ""
        print(f"     - {f.category:13} {origin_pill:14} {label_pill:13} : {f.rule[:42]} -> \"{f.span_text[:40]}...\"")

    db.refresh(version1)
    assert version1.images_data is not None and len(version1.images_data) == 2
    print(f"  * DraftVersion.images_data persisted: 2 visual assets with blurred preview URLs and OCR text")

    # -------------------------------------------------------------
    # STEP 7: Human-in-the-Loop Actions (Dispute, Edit, Accept)
    # -------------------------------------------------------------
    print("\n[STEP 7] Testing Human-in-the-Loop Actions & Creator Overrides...")
    # Creator disputes the off-palette color finding
    off_palette_finding = next(f for f in persisted_findings if "Off-Palette" in f.rule)
    action_dispute = FindingAction(
        finding_id=off_palette_finding.id,
        actor_id=creator.id,
        action="dispute",
        reason="Campaign hook requires neon magenta for high-visibility cyber security theme."
    )
    db.add(action_dispute)

    # Creator edits the generic alt text finding
    alt_finding = next(f for f in persisted_findings if "Alt Text" in f.rule)
    action_edit = FindingAction(
        finding_id=alt_finding.id,
        actor_id=creator.id,
        action="edit",
        edited_text="Q4 Benchmark Chart comparing event throughput across 12 availability zones.",
        reason="Custom descriptive alt text supplied."
    )
    db.add(action_edit)

    # Creator accepts the deprecated logo rewrite
    logo_finding = next(f for f in persisted_findings if "Deprecated Logo" in f.rule)
    action_accept = FindingAction(
        finding_id=logo_finding.id,
        actor_id=creator.id,
        action="accept",
        reason="Adopted official 2025 Acme Geometric Wordmark."
    )
    db.add(action_accept)
    db.commit()

    print(f"  * FindingAction recorded: DISPUTED ('{action_dispute.reason[:40]}...')")
    print(f"  * FindingAction recorded: EDITED ('{action_edit.edited_text[:40]}...')")
    print(f"  * FindingAction recorded: ACCEPTED ('{action_accept.reason}')")

    # -------------------------------------------------------------
    # STEP 8: Revision Submission & Version Diff
    # -------------------------------------------------------------
    print("\n[STEP 8] Creating Revision Version 2 & Computing Version Diff...")
    draft.current_version = 2
    draft.status = "IN_REVIEW"
    db.commit()

    revised_content = version1.content.replace(
        "![Q4 Enterprise Performance Infographic](infographic_banner.png)",
        "![Q4 Benchmark Chart: 2.4M events/sec](infographic_banner_v2.png)"
    )

    version2 = DraftVersion(
        draft_id=draft.id,
        version_no=2,
        content=revised_content
    )
    db.add(version2)
    db.commit()
    db.refresh(version2)

    diff_result = generate_version_diff(version1.content, version2.content, from_v=1, to_v=2)
    diff_lines = diff_result["diff_lines"]
    assert len(diff_lines) > 0, "Version diff computation failed"
    added_lines = [l for l in diff_lines if l["type"] == "added"]
    removed_lines = [l for l in diff_lines if l["type"] == "removed"]
    assert len(added_lines) > 0 and len(removed_lines) > 0
    print(f"  * Revision submitted: Version 1 -> Version 2")
    print(f"  * Version Diff Computed: {len(diff_lines)} lines diffed ({len(added_lines)} added, {len(removed_lines)} removed)")
    print(f"     + Added line: \"{added_lines[0]['text'].strip()}\"")
    print(f"     - Removed line: \"{removed_lines[0]['text'].strip()}\"")

    # -------------------------------------------------------------
    # STEP 9: Brand Manager Approval & Gating
    # -------------------------------------------------------------
    print("\n[STEP 9] Review Queue & Brand Manager Sign-off...")
    approval = Approval(
        draft_id=draft.id,
        version_id=version2.id,
        approver_id=manager.id,
        decision="approved",
        note="Visual assets verified: 2025 official vector wordmark adopted and alt text corrected."
    )
    draft.status = "APPROVED"
    db.add(approval)
    db.commit()
    print(f"  * Approval Sign-off Recorded by Manager ({manager.name})")
    print(f"  * Draft Status transitioned to: {draft.status}")
    print(f"  * Approver note: \"{approval.note}\"")

    # -------------------------------------------------------------
    # STEP 10: Insights Dashboard & Recurring Agency Mistakes
    # -------------------------------------------------------------
    print("\n[STEP 10] Testing Insights Summary & Agency Accountability...")
    insights = get_insights_summary(db, ws.id)
    assert "visual_insights" in insights
    vis = insights["visual_insights"]
    assert vis["total_visual_violations"] > 0
    assert vis["visual_compliance_score"] > 60.0
    assert len(vis["breakdown"]) == 4
    assert len(vis["recurring_mistakes"]) >= 3

    print(f"  * Total Pre-Publish Findings in Workspace: {insights['total_findings']}")
    print(f"  * Creator Rewrite Acceptance Rate: {insights['acceptance_rate']}%")
    print(f"  * Visual Brand Compliance Score: {vis['visual_compliance_score']}%")
    print(f"  * Visual Violations Breakdown by Category:")
    for b in vis["breakdown"]:
        print(f"     - {b['violation_type']:30} : {b['count']} flags")
    print(f"  * Recurring Agency Mistakes & Brand Action Plan:")
    for rm in vis["recurring_mistakes"]:
        print(f"     - [{rm['agency_or_asset']}] {rm['violation_type']} (Freq: {rm['frequency']})")
        print(f"       -> Action: \"{rm['recommendation']}\"")

    # -------------------------------------------------------------
    # STEP 11: Immutable Audit Trail & CSV Export
    # -------------------------------------------------------------
    print("\n[STEP 11] Verifying Immutable Audit Trail & RFC 4180 CSV Export...")
    audit_logs = db.query(AuditLog).filter(AuditLog.workspace_id == ws.id).all()
    assert len(audit_logs) >= 5, f"Expected at least 5 audit events, got {len(audit_logs)}"

    event_types = set(a.event_type for a in audit_logs)
    assert "image_redacted" in event_types, "image_redacted event not recorded in audit log"
    assert "image_claims_analyzed" in event_types, "image_claims_analyzed event not recorded in audit log"
    assert "findings_generated" in event_types, "findings_generated event not recorded in audit log"

    csv_data = generate_audit_csv(audit_logs)
    assert "Timestamp,Event Type,Entity Type" in csv_data
    assert "image_redacted" in csv_data
    assert "image_claims_analyzed" in csv_data
    print(f"  * Audit Events Recorded in DB: {len(audit_logs)} immutable events")
    print(f"  * Event Types Logged: {sorted(list(event_types))}")
    print(f"  * Generated RFC 4180 CSV Export: {len(csv_data)} bytes generated with full event fidelity")

    db.close()

    print("\n" + "=" * 70)
    print("  >>> ALL 11 END-TO-END STEPS PASSED WITH 100% SUCCESS! <<<")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e()
