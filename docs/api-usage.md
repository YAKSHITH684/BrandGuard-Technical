# BrandGuard REST API Reference Guide

## 1. Overview and Base URLs

BrandGuard provides an asynchronous RESTful API structured under the `/api` route prefix. All request and response bodies utilize standard JSON encoding (except file upload endpoints using `multipart/form-data` and audit export returning CSV).

- **Local Base URL**: `http://localhost:8000/api`
- **Production Base URL**: `https://brandguard-technical.onrender.com/api`
- **Interactive Swagger Documentation**: Accessible at `/docs` (e.g., `http://localhost:8000/docs`)
- **OpenAPI JSON Schema**: Accessible at `/openapi.json`

---

## 2. Authentication and Authorization

Protected endpoints require a JSON Web Token (JWT) supplied in the `Authorization` HTTP header:
```http
Authorization: Bearer <jwt_access_token>
```

### 2.1 Persona Login (Instant Demo Entrance)
Fast-track authentication for demo environments without password input.
- **Endpoint**: `POST /api/auth/persona-login`
- **Request Body**:
```json
{
  "email": "creator@brandguard.io"
}
```
- **Response**: `200 OK`
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "token_type": "bearer",
  "user": {
    "id": "usr_9918a",
    "name": "Alex Vance",
    "email": "creator@brandguard.io",
    "role": "creator",
    "workspace_id": "ws_default"
  }
}
```

### 2.2 Standard Login
- **Endpoint**: `POST /api/auth/login`
- **Request Body**:
```json
{
  "email": "manager@brandguard.io",
  "password": "password123"
}
```

---

## 3. Draft Management Endpoints

### 3.1 Create Draft
- **Endpoint**: `POST /api/drafts`
- **Request Body**:
```json
{
  "title": "Q3 Enterprise Announcement",
  "content": "Acme Enterprise Hub delivers 99.95% uptime and is 35% faster than cheap alternatives.",
  "channel": "blog"
}
```
- **Response**: `201 Created`
```json
{
  "id": "drf_10293",
  "title": "Q3 Enterprise Announcement",
  "content": "Acme Enterprise Hub delivers 99.95% uptime and is 35% faster than cheap alternatives.",
  "status": "DRAFT",
  "created_at": "2026-10-30T10:15:00Z"
}
```

### 3.2 Trigger Compliance Review
Executes the full inspection pipeline (redaction, deterministic checks, RAG retrieval, and Groq inference).
- **Endpoint**: `POST /api/drafts/{id}/review`
- **Response**: `200 OK`
```json
{
  "draft_id": "drf_10293",
  "status": "IN_REVIEW",
  "findings_count": 2,
  "findings": [
    {
      "id": "fnd_01",
      "rule_name": "Competitor Disparagement",
      "severity": "HIGH",
      "flagged_text": "cheap alternatives",
      "suggested_rewrite": "alternative architectures",
      "source_chunk_id": "chk_guideline_sec2",
      "confidence": 0.98
    }
  ]
}
```

### 3.3 Request AI Auto-Rewrite
Generates a full-text compliant alternative resolving all flagged findings while maintaining author tone.
- **Endpoint**: `POST /api/drafts/{id}/auto-rewrite`
- **Response**: `200 OK`
```json
{
  "original_content": "Acme Enterprise Hub delivers 99.95% uptime and is 35% faster than cheap alternatives.",
  "rewritten_content": "Acme Enterprise Hub delivers 99.95% uptime and is 35% faster than alternative architectures (Benchmark Study BM-2025-04).",
  "changes_summary": "Replaced disparaging term and grounded percentage benchmark."
}
```

### 3.4 Predictive Compliance Scoring
- **Endpoint**: `GET /api/drafts/{id}/predictive-score`
- **Response**: `200 OK`
```json
{
  "overall_score": 88,
  "tone_score": 92,
  "accuracy_score": 85,
  "legal_score": 80,
  "accessibility_score": 95,
  "risk_tier": "LOW"
}
```

---

## 4. Review Queue and Workflow Endpoints

### 4.1 Get Review Queue
Lists all drafts pending review matching the user's role permissions.
- **Endpoint**: `GET /api/reviews`
- **Query Parameters**: `status=IN_REVIEW&limit=20`

### 4.2 Submit Review Decision
Allows authorized Brand Managers and Legal Reviewers to progress draft state.
- **Endpoint**: `POST /api/reviews/{draft_id}/action`
- **Request Body**:
```json
{
  "action": "APPROVE",
  "comments": "Legal review complete; fact-sheet claims verified."
}
```
*Supported Actions*: `APPROVE`, `REJECT`, `REQUEST_CHANGES`.

---

## 5. Standalone Deterministic Checks

Stateless endpoints for real-time validation during content creation:

| Endpoint | Method | Request Body Keys | Evaluated Standard |
|---|---|---|---|
| `/api/checks/banned-terms` | `POST` | `{"text": "..."}` | Dictionary & regex matching against banned list. |
| `/api/checks/readability` | `POST` | `{"text": "..."}` | Flesch Reading Ease & Flesch-Kincaid Grade Level. |
| `/api/checks/contrast` | `POST` | `{"foreground": "#4F46E5", "background": "#FFFFFF"}` | WCAG 2.1 AA contrast ratio (4.5:1 / 3:1). |
| `/api/checks/accessibility`| `POST` | `{"html": "<a href='...'>click here</a>"}` | Vague anchor link detection & alt-text validation. |

---

## 6. Audit and Compliance Endpoints

### 6.1 List Audit Log Events
- **Endpoint**: `GET /api/audit`
- **Query Parameters**: `event_type=REDACTION&limit=50`

### 6.2 Export Audit Trail CSV
Downloads the full append-only audit trail in RFC 4180 compliant CSV format.
- **Endpoint**: `GET /api/audit/export`
- **Response Header**: `Content-Type: text/csv`
