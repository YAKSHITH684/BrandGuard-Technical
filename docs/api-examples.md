# BrandGuard API Request and Response Examples

This document provides production-ready `curl` command examples and JSON payloads demonstrating core BrandGuard API workflows.

---

## 1. Authentication: Persona Fast-Track Login

Authenticate as the Creator persona (Alex Vance) to retrieve a JWT bearer token:

```bash
curl -X POST "http://localhost:8000/api/auth/persona-login" \
  -H "Content-Type: application/json" \
  -d '{"email": "creator@brandguard.io"}'
```

**Response (`200 OK`)**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": "usr_alex_vance",
    "name": "Alex Vance",
    "email": "creator@brandguard.io",
    "role": "creator",
    "workspace_id": "ws_default"
  }
}
```

*Save the `access_token` as an environment variable:*
```bash
export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 2. Submit a Content Draft

Submit a marketing draft containing deliberate compliance issues:

```bash
curl -X POST "http://localhost:8000/api/drafts" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Announcing Acme LiveSync Enterprise",
    "content": "Our new platform powered by HyperSync is the world'\''s best solution, backed by our 99.85% SLA and 100% zero downtime guaranteed.",
    "channel": "blog"
  }'
```

**Response (`201 Created`)**:
```json
{
  "id": "drf_8201",
  "title": "Announcing Acme LiveSync Enterprise",
  "content": "Our new platform powered by HyperSync is the world's best solution, backed by our 99.85% SLA and 100% zero downtime guaranteed.",
  "status": "DRAFT",
  "created_at": "2026-10-30T10:30:00Z"
}
```

---

## 3. Trigger Automated Compliance Review

Run the full inspection pipeline (redaction, deterministic checks, RAG retrieval, ClaimCheck):

```bash
curl -X POST "http://localhost:8000/api/drafts/drf_8201/review" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (`200 OK`)**:
```json
{
  "draft_id": "drf_8201",
  "status": "IN_REVIEW",
  "findings_count": 4,
  "findings": [
    {
      "id": "fnd_101",
      "rule_name": "Prohibited Deprecated Product Name",
      "severity": "CRITICAL",
      "flagged_text": "HyperSync",
      "suggested_rewrite": "Acme LiveSync",
      "source_chunk_id": "chk_guideline_sec2",
      "confidence": 1.0,
      "status": "PENDING"
    },
    {
      "id": "fnd_102",
      "rule_name": "Prohibited Superlative",
      "severity": "HIGH",
      "flagged_text": "world's best",
      "suggested_rewrite": "enterprise-grade",
      "source_chunk_id": "chk_guideline_sec3",
      "confidence": 0.95,
      "status": "PENDING"
    },
    {
      "id": "fnd_103",
      "rule_name": "Outdated Benchmark Claim",
      "severity": "HIGH",
      "flagged_text": "99.85% SLA",
      "suggested_rewrite": "99.95% monthly uptime SLA",
      "source_chunk_id": "chk_factsheet_sec3",
      "confidence": 0.98,
      "status": "PENDING"
    },
    {
      "id": "fnd_104",
      "rule_name": "Prohibited Absolute Guarantee",
      "severity": "HIGH",
      "flagged_text": "100% zero downtime guaranteed",
      "suggested_rewrite": "designed for high fault tolerance",
      "source_chunk_id": "chk_guideline_sec3",
      "confidence": 0.99,
      "status": "PENDING"
    }
  ]
}
```

---

## 4. Request AI Auto-Rewrite

Generate an intent-preserving, fully compliant revision:

```bash
curl -X POST "http://localhost:8000/api/drafts/drf_8201/auto-rewrite" \
  -H "Authorization: Bearer $TOKEN"
```

**Response (`200 OK`)**:
```json
{
  "draft_id": "drf_8201",
  "original_content": "Our new platform powered by HyperSync is the world's best solution, backed by our 99.85% SLA and 100% zero downtime guaranteed.",
  "rewritten_content": "Our new platform powered by Acme LiveSync is an enterprise-grade solution, backed by our 99.95% monthly uptime SLA and designed for high fault tolerance.",
  "status": "SUCCESS"
}
```

---

## 5. Reviewer Approval Action

Authenticate as Marcus Sterling (Legal Reviewer) and approve the revised draft:

```bash
# 1. Login as Reviewer
export REVIEWER_TOKEN=$(curl -s -X POST "http://localhost:8000/api/auth/persona-login" \
  -H "Content-Type: application/json" \
  -d '{"email": "reviewer@brandguard.io"}' | jq -r '.access_token')

# 2. Approve Draft
curl -X POST "http://localhost:8000/api/reviews/drf_8201/action" \
  -H "Authorization: Bearer $REVIEWER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "APPROVE",
    "comments": "All claims aligned with 2025/2026 Fact Sheet. Approved for publication."
  }'
```

**Response (`200 OK`)**:
```json
{
  "draft_id": "drf_8201",
  "new_status": "APPROVED",
  "reviewer_id": "usr_marcus_sterling",
  "approved_at": "2026-10-30T10:45:00Z"
}
```

---

## 6. Standalone Readability and Contrast Checks

Test copy readability independently:

```bash
curl -X POST "http://localhost:8000/api/checks/readability" \
  -H "Content-Type: application/json" \
  -d '{"text": "Acme communicates with authority, clarity, and genuine empathy."}'
```

**Response (`200 OK`)**:
```json
{
  "flesch_reading_ease": 68.2,
  "flesch_kincaid_grade": 7.4,
  "status": "PASS",
  "message": "Readability satisfies enterprise target (Score >= 60)."
}
```

Test WCAG color contrast:

```bash
curl -X POST "http://localhost:8000/api/checks/contrast" \
  -H "Content-Type: application/json" \
  -d '{"foreground": "#4F46E5", "background": "#FFFFFF"}'
```

**Response (`200 OK`)**:
```json
{
  "ratio": 6.84,
  "normal_text_pass": true,
  "large_text_pass": true,
  "wcag_level": "AA"
}
```
