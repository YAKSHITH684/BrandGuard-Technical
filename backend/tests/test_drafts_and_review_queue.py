import pytest
import os
import sys

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from fastapi.testclient import TestClient
from app.main import app
from app.seed.populate_demo_cases import ensure_seed_data

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_tokens():
    """Ensures seed data and obtains auth tokens for creator, brand manager, and legal reviewer."""
    ensure_seed_data()
    res_creator = client.post("/api/auth/login", json={"email": "creator@brandguard.io", "password": "password123"})
    assert res_creator.status_code == 200, f"Creator login failed: {res_creator.text}"
    creator_token = res_creator.json()["access_token"]

    res_mgr = client.post("/api/auth/login", json={"email": "manager@brandguard.io", "password": "password123"})
    assert res_mgr.status_code == 200, f"Manager login failed: {res_mgr.text}"
    mgr_token = res_mgr.json()["access_token"]

    res_rev = client.post("/api/auth/login", json={"email": "reviewer@brandguard.io", "password": "password123"})
    assert res_rev.status_code == 200, f"Reviewer login failed: {res_rev.text}"
    rev_token = res_rev.json()["access_token"]

    return {
        "creator": {"Authorization": f"Bearer {creator_token}"},
        "manager": {"Authorization": f"Bearer {mgr_token}"},
        "reviewer": {"Authorization": f"Bearer {rev_token}"},
    }

# =========================================================================
# 1. NEW DRAFT APPLICATIONS TEST CASES
# =========================================================================

def test_new_draft_clean_application(auth_tokens):
    """Test Case 1: Creator submits compliant copy with zero policy violations."""
    payload = {
        "title": "Clean SOC2 Security Architecture Whitepaper",
        "content": (
            "# Enterprise Security Attestation\n\n"
            "Acme serves over 4,200 enterprise organizations across 45 countries with an audited SOC2 Type II "
            "compliance certification. All customer data at rest utilizes AES-256 encryption with dedicated "
            "customer-managed encryption keys. For full architectural details, visit our Trust Center."
        )
    }
    res = client.post("/api/drafts", json=payload, headers=auth_tokens["creator"])
    assert res.status_code == 200
    data = res.json()
    assert data["title"] == payload["title"]
    assert data["current_version"] == 1
    assert data["status"] == "DRAFT"
    assert data["readability_score"] is not None
    assert data["readability_score"] > 0
    # Clean draft should have 0 high severity findings
    findings = data["current_version_data"]["findings"]
    high_sev = [f for f in findings if f["severity"] == "high"]
    assert len(high_sev) == 0


def test_new_draft_with_banned_terms(auth_tokens):
    """Test Case 2: Creator submits draft containing banned glossary terminology."""
    payload = {
        "title": "Cloud Infrastructure Announcement",
        "content": (
            "# Announcing Next-Gen Infrastructure\n\n"
            "We are upgrading to HyperSync and migrating all clusters to MegaCloud. "
            "Never settle for cheap alternatives."
        )
    }
    res = client.post("/api/drafts", json=payload, headers=auth_tokens["creator"])
    assert res.status_code == 200
    data = res.json()
    findings = data["current_version_data"]["findings"]

    # Verify banned terms detected
    banned_rules = [f["rule"] for f in findings if f["category"] == "terminology"]
    assert any("HyperSync" in r for r in banned_rules)
    assert any("MegaCloud" in r for r in banned_rules)
    assert any("cheap alternatives" in r for r in banned_rules)

    # Check suggested rewrites exist
    hypersync_f = next(f for f in findings if "HyperSync" in f["rule"])
    assert hypersync_f["suggested_rewrite"] == "Acme LiveSync"


def test_new_draft_with_superlatives_and_absolutes(auth_tokens):
    """Test Case 3: Creator submits draft with superlatives, absolutes, and unqualified percentages."""
    payload = {
        "title": "Quarterly Performance Marketing Pitch",
        "content": (
            "# Why Acme is the World's Best Platform\n\n"
            "Acme is the fastest database in history. We offer guaranteed results and are the #1 solution. "
            "Experience 50% faster streaming with zero risk."
        )
    }
    res = client.post("/api/drafts", json=payload, headers=auth_tokens["creator"])
    assert res.status_code == 200
    data = res.json()
    findings = data["current_version_data"]["findings"]

    claim_findings = [f for f in findings if f["category"] == "claim"]
    assert len(claim_findings) >= 3

    # Check rule citations
    rules = [f["rule"] for f in claim_findings]
    assert any("Superlative" in r or "fastest" in r or "World's Best" in r for r in rules)
    assert any("#1" in r for r in rules)
    assert any("guarantee" in r.lower() for r in rules)

    # All claim findings should be high severity
    for cf in claim_findings:
        assert cf["severity"] == "high"


def test_new_draft_privacy_redaction(auth_tokens):
    """Test Case 4: Creator submits draft containing PII and secrets (emails, phones, API keys)."""
    payload = {
        "title": "Internal Integration Specs",
        "content": (
            "Contact our solutions architect at sarah.connor@acmepartner.org or direct line 415-555-8822. "
            "Use production key gsk_mock_testing_sample_secret_key_12345 for authentication."
        )
    }
    res = client.post("/api/drafts", json=payload, headers=auth_tokens["creator"])
    assert res.status_code == 200
    data = res.json()

    # Redacted content should have replaced the sensitive tokens
    redacted = data["current_version_data"]["redacted_content"]
    assert "sarah.connor@acmepartner.org" not in redacted
    assert "415-555-8822" not in redacted
    assert "gsk_mock_testing_sample_secret_key_12345" not in redacted
    assert "[REDACTED_EMAIL" in redacted or "[REDACTED_PHONE" in redacted or "[REDACTED_API_KEY" in redacted


def test_new_draft_with_contrast_and_accessibility(auth_tokens):
    """Test Case 5: Creator submits draft with failing color pairs and accessibility violations."""
    payload = {
        "title": "Product Launch Landing Page Copy",
        "content": (
            "To explore the new enterprise tier, click here right now.\n\n"
            "![Product Screenshot]()"
        ),
        "color_pairs": [
            {"foreground": "#9CA3AF", "background": "#FFFFFF", "label": "Low Contrast Caption", "font_size": "normal"}
        ],
        "alt_texts": [
            {"image_name": "hero_graphic.png", "alt_text": "image"}
        ]
    }
    res = client.post("/api/drafts", json=payload, headers=auth_tokens["creator"])
    assert res.status_code == 200
    data = res.json()
    findings = data["current_version_data"]["findings"]

    a11y_findings = [f for f in findings if f["category"] == "accessibility"]
    assert len(a11y_findings) >= 2

    # Check WCAG contrast and link text
    rules = [f["rule"] for f in a11y_findings]
    assert any("Contrast Ratio" in r for r in rules)
    assert any("click here" in r for r in rules)


def test_draft_revision_and_diff(auth_tokens):
    """Test Case 6: Creator submits a revision, incrementing version to v2, and computes diff."""
    # Step 1: Create draft
    create_res = client.post("/api/drafts", json={
        "title": "Release Notes 2025",
        "content": "Acme LiveSync is the fastest engine in history."
    }, headers=auth_tokens["creator"])
    draft_id = create_res.json()["id"]

    # Step 2: Submit revised version
    rev_payload = {
        "title": "Release Notes 2025 (Refined)",
        "content": "Acme LiveSync is a high-performance streaming engine with verified throughput."
    }
    rev_res = client.post(f"/api/drafts/{draft_id}/versions", json=rev_payload, headers=auth_tokens["creator"])
    assert rev_res.status_code == 200
    rev_data = rev_res.json()
    assert rev_data["current_version"] == 2

    # Step 3: Fetch diff
    diff_res = client.get(f"/api/drafts/{draft_id}/diff?from=1&to=2", headers=auth_tokens["creator"])
    assert diff_res.status_code == 200
    diff_data = diff_res.json()
    assert diff_data["from_version"] == 1
    assert diff_data["to_version"] == 2
    types = [l["type"] for l in diff_data["diff_lines"]]
    assert "removed" in types
    assert "added" in types

# =========================================================================
# 2. REVIEW QUEUE AND WORKFLOW TEST CASES
# =========================================================================

def test_draft_submission_to_review_queue(auth_tokens):
    """Test Case 7: Draft transitions from DRAFT to IN_REVIEW upon submission."""
    create_res = client.post("/api/drafts", json={
        "title": "Q3 Marketing Campaign Brief",
        "content": "Acme LiveSync processes 2.4 million events per second across 12 distributed regions."
    }, headers=auth_tokens["creator"])
    draft_id = create_res.json()["id"]

    # Submit for review
    submit_res = client.post(f"/api/drafts/{draft_id}/submit", headers=auth_tokens["creator"])
    assert submit_res.status_code == 200
    assert submit_res.json()["status"] == "IN_REVIEW"

    # Verify detail shows status IN_REVIEW
    detail_res = client.get(f"/api/drafts/{draft_id}", headers=auth_tokens["creator"])
    assert detail_res.json()["status"] == "IN_REVIEW"


def test_review_queue_listing_and_sensitive_flag(auth_tokens):
    """Test Case 8: Review queue lists pending drafts and flags sensitive claims."""
    # Create draft with high severity superlatives
    create_res = client.post("/api/drafts", json={
        "title": "Unsubstantiated Performance Claims Document",
        "content": "We guarantee 100% satisfaction and are the #1 world's best solution without question."
    }, headers=auth_tokens["creator"])
    draft_id = create_res.json()["id"]
    client.post(f"/api/drafts/{draft_id}/submit", headers=auth_tokens["creator"])

    # Manager checks queue
    queue_res = client.get("/api/reviews", headers=auth_tokens["manager"])
    assert queue_res.status_code == 200
    queue_items = queue_res.json()

    target = next((item for item in queue_items if item["draft_id"] == draft_id), None)
    assert target is not None
    assert target["status"] == "IN_REVIEW"
    assert target["has_sensitive_claims"] is True
    assert target["high_severity_count"] > 0


def test_role_gating_on_sensitive_claims(auth_tokens):
    """Test Case 9: Sensitive claim drafts cannot be approved by Brand Manager; Legal Reviewer is required."""
    create_res = client.post("/api/drafts", json={
        "title": "High Risk Legal Claims Document",
        "content": "Acme guarantees 100% results with zero risk."
    }, headers=auth_tokens["creator"])
    draft_id = create_res.json()["id"]
    client.post(f"/api/drafts/{draft_id}/submit", headers=auth_tokens["creator"])

    # Creator tries to approve -> 403 Forbidden
    res_creator_appr = client.post(f"/api/drafts/{draft_id}/approve", json={"note": "Creator auto-approval"}, headers=auth_tokens["creator"])
    assert res_creator_appr.status_code == 403

    # Brand Manager tries to approve sensitive draft -> 403 Forbidden (requires legal)
    res_mgr_appr = client.post(f"/api/drafts/{draft_id}/approve", json={"note": "Manager signoff"}, headers=auth_tokens["manager"])
    assert res_mgr_appr.status_code == 403
    assert "Legal Reviewer" in res_mgr_appr.json()["detail"]

    # Legal Reviewer approves -> 200 OK
    res_rev_appr = client.post(f"/api/drafts/{draft_id}/approve", json={"note": "Legal approved with exemption"}, headers=auth_tokens["reviewer"])
    assert res_rev_appr.status_code == 200
    assert res_rev_appr.json()["decision"] == "approved"

    # Verify status is now APPROVED
    draft_check = client.get(f"/api/drafts/{draft_id}", headers=auth_tokens["creator"])
    assert draft_check.json()["status"] == "APPROVED"


def test_brand_manager_approves_standard_draft(auth_tokens):
    """Test Case 10: Brand Manager can approve standard compliant drafts."""
    create_res = client.post("/api/drafts", json={
        "title": "Standard Compliant Technical Blog Post",
        "content": (
            "# Cloud Architecture Overview\n\n"
            "Acme serves 4,200 enterprise customers across 45 countries with an active SOC2 Type II certification. "
            "Data encryption uses AES-256 with customer keys."
        )
    }, headers=auth_tokens["creator"])
    draft_id = create_res.json()["id"]
    client.post(f"/api/drafts/{draft_id}/submit", headers=auth_tokens["creator"])

    # Brand manager approves
    res_mgr_appr = client.post(f"/api/drafts/{draft_id}/approve", json={"note": "Approved by Brand Lead"}, headers=auth_tokens["manager"])
    assert res_mgr_appr.status_code == 200
    assert res_mgr_appr.json()["decision"] == "approved"

    draft_check = client.get(f"/api/drafts/{draft_id}", headers=auth_tokens["creator"])
    assert draft_check.json()["status"] == "APPROVED"


def test_request_changes_workflow(auth_tokens):
    """Test Case 11: Reviewer requests revisions with compliance note."""
    create_res = client.post("/api/drafts", json={
        "title": "Draft Needing Polish",
        "content": "Acme is great."
    }, headers=auth_tokens["creator"])
    draft_id = create_res.json()["id"]
    client.post(f"/api/drafts/{draft_id}/submit", headers=auth_tokens["creator"])

    # Reviewer requests changes
    req_res = client.post(f"/api/drafts/{draft_id}/request-changes", json={"note": "Add specific product benchmark data."}, headers=auth_tokens["reviewer"])
    assert req_res.status_code == 200
    assert req_res.json()["decision"] == "changes_requested"

    # Status transitions to CHANGES_REQUESTED
    draft_check = client.get(f"/api/drafts/{draft_id}", headers=auth_tokens["creator"])
    assert draft_check.json()["status"] == "CHANGES_REQUESTED"


def test_finding_dispute_updates_draft_status(auth_tokens):
    """Test Case 12: Creator disputes a finding, updating draft status to DISPUTED."""
    create_res = client.post("/api/drafts", json={
        "title": "Visionary Manifesto Draft",
        "content": "We are building the world's best data pipeline."
    }, headers=auth_tokens["creator"])
    draft_id = create_res.json()["id"]
    client.post(f"/api/drafts/{draft_id}/submit", headers=auth_tokens["creator"])

    draft_detail = client.get(f"/api/drafts/{draft_id}", headers=auth_tokens["creator"]).json()
    findings = draft_detail["current_version_data"]["findings"]
    assert len(findings) > 0
    finding_id = findings[0]["id"]

    # Dispute finding with reason
    dispute_res = client.post(f"/api/findings/{finding_id}/dispute", json={
        "action": "dispute",
        "reason": "Executive leadership explicitly requested this phrasing for the keynote."
    }, headers=auth_tokens["creator"])
    assert dispute_res.status_code == 200
    assert dispute_res.json()["action"] == "dispute"

    # Draft status transitions to DISPUTED
    draft_check = client.get(f"/api/drafts/{draft_id}", headers=auth_tokens["creator"])
    assert draft_check.json()["status"] == "DISPUTED"

    # Appears in review queue as DISPUTED
    queue_res = client.get("/api/reviews", headers=auth_tokens["manager"])
    target = next((item for item in queue_res.json() if item["draft_id"] == draft_id), None)
    assert target is not None
    assert target["status"] == "DISPUTED"
