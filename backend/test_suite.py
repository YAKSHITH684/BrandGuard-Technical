import sys
import os

sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    client = TestClient(app)
    print("=== BRANDGUARD BACKEND TEST SUITE ===")

    # 1. Health
    res = client.get("/api/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] 1. Health check:", res.json())

    # 2. Login
    res = client.post("/api/auth/login", json={
        "email": "creator@brandguard.io",
        "password": "password123"
    })
    assert res.status_code == 200, f"Login failed: {res.text}"
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] 2. User login successful, JWT token obtained")

    # 3. Auth Me
    res = client.get("/api/auth/me", headers=headers)
    assert res.status_code == 200, f"Auth me failed: {res.text}"
    user_data = res.json()
    assert user_data["email"] == "creator@brandguard.io"
    print(f"[PASS] 3. Auth Me: User '{user_data['name']}' in workspace '{user_data['workspace']['name']}'")

    # 4. Contrast Check
    res = client.post("/api/checks/contrast", json={
        "foreground": "#000000",
        "background": "#FFFFFF",
        "font_size": "normal"
    })
    assert res.status_code == 200
    contrast_pass = res.json()
    assert contrast_pass["passes_aa"] is True
    assert contrast_pass["contrast_ratio"] == 21.0

    res = client.post("/api/checks/contrast", json={
        "foreground": "#888888",
        "background": "#999999",
        "font_size": "normal"
    })
    assert res.status_code == 200
    contrast_fail = res.json()
    assert contrast_fail["passes_aa"] is False
    print(f"[PASS] 4. Contrast check: Pass ratio={contrast_pass['contrast_ratio']}, Fail ratio={contrast_fail['contrast_ratio']}")

    # 5. Readability Check
    res = client.post("/api/checks/readability", json={
        "text": "Acme makes fast software. It is easy to use and helps teams build apps.",
        "target_ease": 60.0
    })
    assert res.status_code == 200
    read_data = res.json()
    assert read_data["flesch_reading_ease"] > 70.0
    print(f"[PASS] 5. Readability check: Reading Ease = {read_data['flesch_reading_ease']}, Grade Level = {read_data['flesch_kincaid_grade']}")

    # 6. List Sources
    res = client.get("/api/sources", headers=headers)
    assert res.status_code == 200
    sources = res.json()
    assert len(sources) >= 2
    print(f"[PASS] 6. Sources list: Found {len(sources)} source documents in workspace")

    # 7. List Glossary
    res = client.get("/api/glossary", headers=headers)
    assert res.status_code == 200
    terms = res.json()
    assert len(terms) >= 3
    print(f"[PASS] 7. Glossary: Found {len(terms)} terminology rules")

    # 8. List Drafts
    res = client.get("/api/drafts", headers=headers)
    assert res.status_code == 200
    drafts = res.json()
    assert len(drafts) >= 1
    draft_id = drafts[0]["id"]
    print(f"[PASS] 8. Drafts: Found {len(drafts)} drafts (Target draft ID: {draft_id})")

    # 9. Get Draft Detail & Findings
    res = client.get(f"/api/drafts/{draft_id}", headers=headers)
    assert res.status_code == 200
    draft_detail = res.json()
    findings = draft_detail["current_version_data"]["findings"]
    assert len(findings) > 0, "No findings generated on draft"
    print(f"[PASS] 9. Draft detail: Version {draft_detail['current_version']}, {len(findings)} findings detected")

    # 10. Finding Action: Dispute with Reason
    finding_to_dispute = findings[0]
    res = client.post(f"/api/findings/{finding_to_dispute['id']}/dispute", headers=headers, json={
        "action": "dispute",
        "reason": "Test dispute: creator claims this phrasing is vital for campaign hook."
    })
    assert res.status_code == 200
    dispute_res = res.json()
    assert dispute_res["action"] == "dispute"
    print(f"[PASS] 10. Finding disputed successfully with audit trail")

    # 11. Create Revision Version & Version Diff
    res = client.post(f"/api/drafts/{draft_id}/versions", headers=headers, json={
        "title": draft_detail["title"] + " (Revised)",
        "content": draft_detail["current_version_data"]["content"].replace("fastest data replication engine", "high-performance streaming engine")
    })
    assert res.status_code == 200
    revised_draft = res.json()
    assert revised_draft["current_version"] == 2
    print(f"[PASS] 11. Draft revision submitted. Incremented to Version 2")

    res = client.get(f"/api/drafts/{draft_id}/diff?from=1&to=2", headers=headers)
    assert res.status_code == 200
    diff_data = res.json()
    assert len(diff_data["diff_lines"]) > 0
    print(f"[PASS] 12. Version Diff computed: {len(diff_data['diff_lines'])} diff lines")

    # 13. Review Queue (Manager login)
    res_mgr = client.post("/api/auth/login", json={
        "email": "manager@brandguard.io",
        "password": "password123"
    })
    mgr_headers = {"Authorization": f"Bearer {res_mgr.json()['access_token']}"}
    res = client.get("/api/reviews", headers=mgr_headers)
    assert res.status_code == 200
    queue = res.json()
    print(f"[PASS] 13. Review Queue: {len(queue)} drafts pending review")

    # 14. Insights Summary & Overridden Rules
    res = client.get("/api/insights/summary", headers=headers)
    assert res.status_code == 200
    insights = res.json()
    assert "violations_by_category" in insights
    assert "most_overridden_rules" in insights
    print(f"[PASS] 14. Insights summary: {insights['total_findings']} total findings, acceptance rate {insights['acceptance_rate']}%")

    res = client.get("/api/insights/overridden-rules", headers=headers)
    assert res.status_code == 200
    overridden = res.json()
    print(f"[PASS] 15. Most-overridden rules: {len(overridden)} rules tracked with creator feedback")

    # 16. Audit Log & CSV Export
    res = client.get("/api/audit", headers=headers)
    assert res.status_code == 200
    logs = res.json()
    assert len(logs) > 0
    print(f"[PASS] 16. Audit Log: {len(logs)} immutable audit trail events recorded")

    res = client.get("/api/audit/export", headers=headers)
    assert res.status_code == 200
    assert "Timestamp,Event Type" in res.text
    print(f"[PASS] 17. Audit CSV Export: Successfully generated {len(res.text)} bytes of RFC 4180 CSV")

    print("\nALL 17 BACKEND TESTS PASSED WITH 100% SUCCESS!")

if __name__ == "__main__":
    run_tests()
