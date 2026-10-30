# Database Schema and Persistence Design

## 1. Storage Architecture Overview

BrandGuard utilizes **SQLAlchemy 2.0** ORM configured with dual-dialect database support:
1. **Production Mode (PostgreSQL + pgvector)**: Connects to managed PostgreSQL with native vector storage (`VECTOR(384)`) for fast cosine similarity nearest-neighbor lookups.
2. **Development / Offline Mode (SQLite Fallback)**: Automatically activates when `DATABASE_URL` is unset or points to an offline instance. Uses standard SQLite column types and calculates cosine distance in application memory.

---

## 2. Entity-Relationship Overview

```
+----------------+       1:N       +-------------------+
|   Workspaces   | <-------------- |       Users       |
+----------------+                 +-------------------+
        | 1:N                                | 1:N
        |                                    |
        v                                    v
+----------------+       1:N       +-------------------+
|    Sources     | --------------> |      Drafts       |
+----------------+                 +-------------------+
        | 1:N                                | 1:N
        v                                    +-----------------+
+----------------+                           | 1:N             | 1:N
|  SourceChunks  |                           v                 v
|  (Embeddings)  |                 +------------------+  +-------------+
+----------------+                 |  DraftVersions   |  |  Findings   |
                                   +------------------+  +-------------+
                                             |                 |
                                             v                 v
                                   +------------------+  +-------------+
                                   |    Approvals     |  | AuditLogs   |
                                   +------------------+  +-------------+
```

---

## 3. Data Dictionary

### 3.1 `workspaces`
Defines tenant boundaries for enterprise organizations.
- `id` (String, Primary Key): Unique workspace identifier (e.g., `ws_acme`).
- `name` (String): Organization name.
- `created_at` (DateTime): Timestamp of creation.

### 3.2 `users`
Accounts belonging to a workspace with role-based permissions.
- `id` (String, Primary Key): Unique user ID.
- `email` (String, Unique): User email address.
- `hashed_password` (String): Secure bcrypt-hashed password string.
- `name` (String): Display name (e.g., *Alex Vance*).
- `role` (Enum): `creator`, `manager`, or `reviewer`.
- `workspace_id` (String, Foreign Key -> `workspaces.id`).

### 3.3 `sources` & `source_chunks`
Represents ingested brand guidelines, corporate fact sheets, and terminology glossaries.
- `sources`:
  - `id` (String, Primary Key): Unique source ID.
  - `title` (String): Document title (e.g., *Acme Brand Guidelines 2026*).
  - `source_type` (Enum): `guideline`, `fact_sheet`, `glossary`.
  - `version` (String): Version tag.
- `source_chunks`:
  - `id` (String, Primary Key): Unique chunk ID (e.g., `chk_guideline_sec3`).
  - `source_id` (String, Foreign Key -> `sources.id`).
  - `section_title` (String): Section heading or category.
  - `content` (Text): Chunk text content.
  - `effective_date` (Date, Nullable): Date from which the assertion is valid.
  - `expiry_date` (Date, Nullable): Date after which the claim becomes outdated.
  - `embedding` (Vector/JSON): 384-dimensional dense semantic embedding.

### 3.4 `drafts` & `draft_versions`
Core content objects undergoing brand and legal governance.
- `drafts`:
  - `id` (String, Primary Key): Unique draft ID.
  - `workspace_id` (String, Foreign Key -> `workspaces.id`).
  - `author_id` (String, Foreign Key -> `users.id`).
  - `title` (String): Draft headline or campaign title.
  - `content` (Text): Latest working draft copy.
  - `channel` (String): Target publication channel (blog, social, press release).
  - `status` (Enum): `DRAFT`, `IN_REVIEW`, `CHANGES_REQUESTED`, `DISPUTED`, `APPROVED`.
  - `overall_score` (Integer): Combined compliance score (0–100).
  - `tone_score` (Integer): Voice and tone adherence score (0–100).
  - `accuracy_score` (Integer): ClaimCheck fact-sheet grounding score (0–100).
  - `legal_score` (Integer): Regulatory and warranty risk rating (0–100).
  - `accessibility_score` (Integer): Readability and WCAG rating (0–100).
- `draft_versions`:
  - `id` (String, Primary Key): Version ID.
  - `draft_id` (String, Foreign Key -> `drafts.id`).
  - `version_number` (Integer): Sequential version counter.
  - `content` (Text): Historical copy snapshot.
  - `created_at` (DateTime): Snapshot timestamp.

### 3.5 `findings`
Actionable compliance violations identified during automated or manual review.
- `id` (String, Primary Key): Finding ID.
- `draft_id` (String, Foreign Key -> `drafts.id`).
- `source_chunk_id` (String, Nullable, Foreign Key -> `source_chunks.id`): Cited guideline or fact-sheet excerpt.
- `rule_name` (String): Violated policy name (e.g., *Prohibited Superlative*).
- `rule_category` (Enum): `terminology`, `claim`, `readability`, `contrast`, `accessibility`, `privacy`.
- `severity` (Enum): `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`, `INFO`.
- `flagged_text` (Text): Exact text span identified.
- `suggested_rewrite` (Text, Nullable): Proposed guideline-aligned replacement.
- `confidence` (Float): Model or heuristic confidence score (0.00 – 1.00).
- `status` (Enum): `PENDING`, `ACCEPTED`, `EDITED`, `REJECTED`, `DISPUTED`.
- `dispute_reason` (Text, Nullable): Creator explanation when disputing a finding.

### 3.6 `approvals` & `audit_logs`
- `approvals`: Records gated sign-offs with reviewer ID, decision, and comments.
- `audit_logs`: Immutable, append-only records tracking system actions (`REDACTION`, `SCAN`, `APPROVAL`, `DISPUTE`, `EXPORT`).
