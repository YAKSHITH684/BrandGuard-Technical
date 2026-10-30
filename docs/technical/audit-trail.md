# Technical Specification: Immutable Audit Trail and Compliance Logging

## 1. Overview and Compliance Mandate

Enterprise organizations subject to regulatory oversight (SEC, FTC, GDPR, SOC 2 Type II, and the EU AI Act) must maintain verifiable, tamper-resistant records of all content publications, claim verifications, and AI-assisted editorial interventions.

The **Audit Trail Subsystem** (`backend/app/services/audit.py`) implements an append-only event ledger capturing every security, review, and publication decision across the platform.

```
+--------------------------------------------------------------------------+
|                  Application Event Trigger                               |
|   (PII Redaction, Scan Execution, Finding Dispute, Approval Sign-off)    |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Append-Only Audit Log Writer                            |
|   - Generates unique UUID event ID and ISO 8601 UTC timestamp            |
|   - Records actor_id, workspace_id, event_type, resource_id              |
|   - Injects structured JSON details without mutable update hooks         |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Export & Verification Engine                            |
|   - GET /api/audit (Paginated UI view with search and filters)           |
|   - GET /api/audit/export (RFC 4180 compliant CSV stream)                |
+--------------------------------------------------------------------------+
```

---

## 2. Event Types and Schema

Audit events are stored in the `audit_logs` table:

| Column | Type | Description |
|---|---|---|
| `id` | String (UUID) | Unique, non-sequential event identifier. |
| `workspace_id` | String | Multi-tenant tenant boundary identifier. |
| `actor_id` | String | ID of user who initiated action (or `system_daemon`). |
| `event_type` | Enum | Categorized event type (see matrix below). |
| `resource_type` | String | Type of resource (`draft`, `source`, `finding`, `user`). |
| `resource_id` | String | Unique ID of resource affected. |
| `details` | JSON/Text | Structured metadata describing action context. |
| `created_at` | DateTime | Immutable UTC timestamp. |

### 2.1 Event Type Matrix
- **`REDACTION`**: Pre-flight masking of sensitive PII or credentials. Stores masked pattern type without storing the secret payload.
- **`REVIEW_SCAN`**: Completion of deterministic checks and RAG retrieval on a draft.
- **`CLAIM_VERIFICATION`**: ClaimCheck verdict (Supported, Outdated, Unsupported) against fact sheet chunks.
- **`FINDING_DISPUTE`**: Content creator disputed a rule finding, including the dispute rationale.
- **`FINDING_ACCEPTED`**: Content creator applied a recommended rewrite.
- **`DRAFT_APPROVAL`**: Brand Manager or Legal Reviewer signed off on a draft.
- **`SOURCE_INGESTION`**: New guideline, fact sheet, or glossary uploaded.
- **`AUDIT_EXPORT`**: A user generated and downloaded an audit trail CSV export.

---

## 3. RFC 4180 CSV Export Specification

The endpoint `GET /api/audit/export` streams the full audit log in strict RFC 4180 CSV format:
- **Header Line**: `timestamp,event_id,event_type,actor_name,actor_email,actor_role,resource_id,details`
- **Field Escaping**: Fields containing commas, quotation marks (`"`), or newlines are wrapped in double quotes, with internal quotes escaped as `""`.
- **Character Encoding**: UTF-8 with BOM option for seamless import into Microsoft Excel and enterprise SIEM platforms.
- **Streaming Response**: Emits data in chunks to prevent memory spikes when exporting hundreds of thousands of records.
