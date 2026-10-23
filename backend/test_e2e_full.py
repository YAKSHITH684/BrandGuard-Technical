import sys
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows console
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000/api"
FRONTEND_URL = "http://localhost:3000"

def request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}" if endpoint.startswith("/") else f"{BASE_URL}/{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=35) as resp:
            content_type = resp.headers.get("Content-Type", "")
            if "text/csv" in content_type:
                return resp.read().decode("utf-8")
            raw = resp.read().decode("utf-8")
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        err_msg = e.read().decode("utf-8")
        raise RuntimeError(f"HTTP {e.code} on {method} {url}: {err_msg}")

def check_frontend(path=""):
    url = f"{FRONTEND_URL}{path}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=5) as resp:
        return resp.status, len(resp.read())

def run_e2e_tests():
    print("=" * 70)
    print("       BRANDGUARD COMPREHENSIVE END-TO-END TEST EXECUTION       ")
    print("=" * 70)

    # 1. Backend Health Check
    print("\n[STEP 1] Testing Backend Health Heartbeat...")
    health = request("/health")
    assert health.get("status") == "healthy", f"Health failed: {health}"
    print(f"  ✓ Service: {health.get('service')} v{health.get('version')}")
    print(f"  ✓ Groq LLM Configured: {health.get('groq_configured')}")

    # 2. Authentication & Multi-Role Personas
    print("\n[STEP 2] Testing Persona Authentication (Creator, Manager, Reviewer)...")
    creator_login = request("/auth/login", method="POST", data={"email": "creator@brandguard.io", "password": "password123"})
    creator_token = creator_login["access_token"]
    creator_me = request("/auth/me", token=creator_token)
    assert creator_me["role"] == "creator", f"Expected creator, got {creator_me['role']}"
    print(f"  ✓ Creator Persona: {creator_me['name']} (Workspace: {creator_me['workspace']['name']})")

    mgr_login = request("/auth/login", method="POST", data={"email": "manager@brandguard.io", "password": "password123"})
    mgr_token = mgr_login["access_token"]
    mgr_me = request("/auth/me", token=mgr_token)
    assert mgr_me["role"] == "brand_manager"
    print(f"  ✓ Brand Manager Persona: {mgr_me['name']}")

    rev_login = request("/auth/login", method="POST", data={"email": "reviewer@brandguard.io", "password": "password123"})
    rev_token = rev_login["access_token"]
    rev_me = request("/auth/me", token=rev_token)
    assert rev_me["role"] == "reviewer"
    print(f"  ✓ Legal Reviewer Persona: {rev_me['name']}")

    # 3. Approved Knowledge Sources & Retrieval
    print("\n[STEP 3] Testing Approved Knowledge Sources & Glossary Rules...")
    sources = request("/sources", token=mgr_token)
    assert len(sources) >= 2, f"Expected at least 2 source docs, found {len(sources)}"
    print(f"  ✓ Approved Sources in Workspace: {len(sources)} documents")
    for s in sources:
        print(f"    - [{s.get('source_type')}] {s.get('title')} ({s.get('chunk_count', 0)} indexed chunks)")

    glossary = request("/glossary", token=mgr_token)
    assert len(glossary) >= 5, f"Expected >= 5 terms, found {len(glossary)}"
    print(f"  ✓ Terminology Rules: {len(glossary)} active rules")
    banned_terms = [t["term"] for t in glossary if t["type"] == "banned"]
    print(f"    - Banned terms tracked: {', '.join(banned_terms[:4])}")

    # 4. Standalone Deterministic Governance Checks
    print("\n[STEP 4] Testing Deterministic Standalone Checks (WCAG Contrast & Readability)...")
    contrast_pass = request("/checks/contrast", method="POST", data={"foreground": "#000000", "background": "#FFFFFF", "font_size": "normal"})
    assert contrast_pass["passes_aa"] is True, "Contrast AA check failed"
    print(f"  ✓ Contrast Check: ratio {contrast_pass['contrast_ratio']} -> Passes AA: {contrast_pass['passes_aa']}, AAA: {contrast_pass['passes_aaa']}")

    readability = request("/checks/readability", method="POST", data={"text": "Acme Hub delivers fast and simple database integration for modern developers.", "target_ease": 60.0})
    print(f"  ✓ Readability Check: Flesch Reading Ease = {readability['flesch_reading_ease']} (Passes Target: {readability['passes_target']})")

    # 5. Draft Creation, Automated Rule Scanning & ClaimCheck
    print("\n[STEP 5] Testing Draft Submission & Automated Multi-Rule Governance Scan...")
    draft_payload = {
        "title": "E2E Launch Campaign: HyperSync Database Accelerator",
        "content_type": "marketing_copy",
        "content": (
            "Experience the unmatched power of HyperSync. We guarantee 100% zero downtime and absolute perfection. "
            "Our database accelerator is undeniably the fastest engine on the planet, outperforming all competitors by 10x. "
            "Fully compliant with SOC2 Type II standards as certified in our 2025 security assessment."
        )
    }
    new_draft = request("/drafts", method="POST", data=draft_payload, token=creator_token)
    draft_id = new_draft["id"]
    print(f"  ✓ Draft Created: ID {draft_id} (Status: {new_draft['status']}, Version: {new_draft['current_version']})")

    draft_detail = request(f"/drafts/{draft_id}", token=creator_token)
    findings = draft_detail.get("current_version_data", {}).get("findings", [])
    print(f"  ✓ Scan Findings Detected: {len(findings)} findings")
    for idx, f in enumerate(findings, 1):
        print(f"    [{idx}] {f['category'].upper()} ({f['severity']}): {f['rule'][:75]} (Span: '{f['span_text']}')")

    # Verify banned term finding
    has_banned_term = any(f.get("category") == "terminology" and "HyperSync" in f.get("span_text", "") for f in findings)
    assert has_banned_term, "Expected banned term finding for 'HyperSync'"
    print("  ✓ Banned Term Check verified: Correctly flagged 'HyperSync'")

    # 6. Finding Disposition & Dispute Workflow
    print("\n[STEP 6] Testing Findings Resolution (Accept / Dispute) & Revision Diffing...")
    # Dispute one finding
    finding_to_dispute = findings[0]
    dispute_resp = request(
        f"/findings/{finding_to_dispute['id']}/dispute",
        method="POST",
        data={"action": "dispute", "reason": "Customer case study validates this throughput metric under controlled benchmark testing."},
        token=creator_token
    )
    print(f"  ✓ Finding Disputed: ID {finding_to_dispute['id']} -> Action: {dispute_resp['action']}")

    # Submit Version 2 Revision
    revised_content = (
        "Experience the high performance of Acme LiveSync. We guarantee 99.95% monthly uptime per our 2025 SLA. "
        "Our streaming engine provides demonstrated leading throughput. "
        "Fully compliant with SOC2 Type II standards as certified in our 2025 security assessment."
    )
    v2_resp = request(
        f"/drafts/{draft_id}/versions",
        method="POST",
        data={"title": "E2E Launch Campaign: Acme LiveSync Upgrade", "content": revised_content},
        token=creator_token
    )
    v2_findings = v2_resp.get("current_version_data", {}).get("findings", [])
    print(f"  ✓ Revision Submitted: Version {v2_resp['current_version']} created with {len(v2_findings)} remaining findings")

    # Test Version Diff
    diff_resp = request(f"/drafts/{draft_id}/diff?from=1&to=2", token=creator_token)
    print(f"  ✓ Version Diff Computed: {len(diff_resp.get('diff_lines', []))} changed lines identified")

    # Submit draft for review
    submit_resp = request(f"/drafts/{draft_id}/submit", method="POST", token=creator_token)
    assert submit_resp["status"] == "IN_REVIEW", f"Expected IN_REVIEW, got {submit_resp['status']}"
    print(f"  ✓ Draft Submitted for Review: Status is now '{submit_resp['status']}'")

    # 7. Review Queue & Brand Manager / Legal Approval
    print("\n[STEP 7] Testing Legal / Brand Manager Review Queue & Approval...")
    queue = request("/reviews", token=mgr_token)
    in_queue = any(d.get("draft_id") == draft_id or d.get("id") == draft_id for d in queue)
    assert in_queue, f"Draft {draft_id} not found in Review Queue"
    print(f"  ✓ Review Queue: Found {len(queue)} pending drafts awaiting review (Draft {draft_id[:8]} confirmed in queue)")

    # Add review comment
    comment_resp = request(
        f"/drafts/{draft_id}/comments",
        method="POST",
        data={"body": "Verified: Acme LiveSync terminology is approved and SLA citations match 2025 fact sheet."},
        token=mgr_token
    )
    print(f"  ✓ Reviewer Comment Recorded: \"{comment_resp['body'][:60]}...\"")

    # Approve Draft as Legal Reviewer
    approve_resp = request(
        f"/drafts/{draft_id}/approve",
        method="POST",
        data={"decision": "approved", "note": "All policy violations resolved. Approved for production publishing."},
        token=rev_token
    )
    assert approve_resp["decision"] == "approved", f"Expected approved, got {approve_resp['decision']}"
    final_draft = request(f"/drafts/{draft_id}", token=creator_token)
    assert final_draft["status"] == "APPROVED", f"Expected APPROVED, got {final_draft['status']}"
    print(f"  ✓ Draft Approved by Legal Reviewer: Final Status = '{final_draft['status']}'")

    # 8. BrandGuard AI Copilot (Groq AI Chatbot)
    print("\n[STEP 8] Testing BrandGuard AI Copilot (Guest & Authenticated Queries)...")
    # Prompt A: Guest inquiry for banned term
    copilot_a = request("/ai/chat", method="POST", data={"message": "Can I say 'HyperSync' in our marketing launch?"})
    print(f"  ✓ Copilot Inquiry 1 (Banned Term):")
    print(f"    - Model: {copilot_a.get('model_used')} (Status: {copilot_a.get('ai_status')})")
    print(f"    - Reply excerpt: {copilot_a.get('reply', '')[:120].strip()}...")
    assert "HyperSync" in copilot_a.get("reply", "") or "Acme LiveSync" in copilot_a.get("reply", "") or "banned" in copilot_a.get("reply", "").lower(), "Term guidance missing"

    # Prompt B: Verified metric inquiry
    copilot_b = request("/ai/chat", method="POST", data={"message": "What is our verified 2025 SLA uptime?"})
    print(f"  ✓ Copilot Inquiry 2 (Fact Sheet Retrieval):")
    print(f"    - Cited Sources: {len(copilot_b.get('cited_sources', []))} chunks")
    print(f"    - Reply excerpt: {copilot_b.get('reply', '')[:120].strip()}...")
    assert len(copilot_b.get("reply", "")) > 10, "Copilot reply was empty"

    # Prompt C: Authenticated conversation with history
    copilot_c = request(
        "/ai/chat",
        method="POST",
        data={
            "message": "Can I claim our database is the fastest?",
            "history": [
                {"role": "user", "content": "Hello!"},
                {"role": "assistant", "content": "Hello! How can I assist with your copy?"}
            ]
        },
        token=creator_token
    )
    print(f"  ✓ Copilot Inquiry 3 (Claims Policy 3.2):")
    print(f"    - Reply excerpt: {copilot_c.get('reply', '')[:120].strip()}...")

    # 9. Insights & Analytics
    print("\n[STEP 9] Testing Governance Insights & Overridden Rules Tracking...")
    insights = request("/insights/summary", token=mgr_token)
    print(f"  ✓ Insights Summary: {insights.get('total_findings')} total findings evaluated across drafts")
    print(f"    - By Severity: {insights.get('by_severity')}")
    print(f"    - By Rule Type: {insights.get('by_rule_type')}")

    overridden = request("/insights/overridden-rules", token=mgr_token)
    print(f"  ✓ Overridden Rules Tracked: {len(overridden)} rules with creator feedback")

    # 10. Audit Trail & CSV Export
    print("\n[STEP 10] Testing Immutable Audit Trail & RFC 4180 CSV Export...")
    audit_data = request("/audit?limit=10", token=mgr_token)
    audit_items = audit_data.get("items", [])
    print(f"  ✓ Audit Log: {audit_data.get('total')} total audit entries recorded")
    print(f"    - Recent event types: {', '.join([e['event_type'] for e in audit_items[:4]])}")

    csv_data = request("/audit/export", token=mgr_token)
    assert "id,timestamp,workspace_id" in csv_data, "CSV header missing or invalid"
    csv_lines = csv_data.strip().split("\n")
    print(f"  ✓ RFC 4180 CSV Export: {len(csv_lines)} rows generated ({len(csv_data)} bytes)")

    # 11. Frontend Server Verification
    print("\n[STEP 11] Verifying Next.js Frontend Pages on http://localhost:3000...")
    pages_to_test = ["", "/login", "/dashboard", "/drafts", "/reviews", "/sources", "/insights", "/audit", "/settings"]
    for p in pages_to_test:
        status, length = check_frontend(p)
        assert status == 200, f"Page {p} returned HTTP {status}"
        print(f"  ✓ Page '{p or '/'}' -> HTTP {status} ({length} bytes)")

    print("\n" + "=" * 70)
    print("  ALL 11 END-TO-END WORKFLOW STAGES EXECUTED AND PASSED WITH 100% SUCCESS!  ")
    print("=" * 70)

if __name__ == "__main__":
    try:
        run_e2e_tests()
    except Exception as e:
        print(f"\n❌ E2E TEST FAILED: {e}")
        sys.exit(1)
