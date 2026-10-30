# Repository and System Maintenance Guidelines

## 1. Routine System Maintenance

Maintaining high reliability, compliance integrity, and low latency requires ongoing operational upkeep across the database, knowledge base, and dependencies.

---

## 2. Knowledge Base and Guideline Management

### 2.1 Updating Living Guidelines
Brand guidelines change periodically as brand voice evolves or product lines update:
1. Navigate to the **Sources** tab (`/sources`) in BrandGuard.
2. Upload the updated guideline document (`.md`, `.pdf`, `.docx`).
3. Set the `effective_date` to the policy launch date.
4. Old guidelines are **never hard-deleted**; they remain archived to preserve historical audit trail integrity for previously approved drafts.

### 2.2 Updating the Terminology Glossary (`glossary.json`)
When legal or marketing teams ban or mandate specific phrases:
1. Edit `backend/app/seed/glossary.json` (or add terms via the `/api/sources` API).
2. Follow the required schema:
   ```json
   {
     "term": "NewBannedTerm",
     "type": "banned",
     "replacement": "PreferredAlternative",
     "note": "Legal compliance policy Section 2.1"
   }
   ```
3. Restart the backend service or trigger the glossary reload endpoint to re-compile regex patterns.

---

## 3. Database Maintenance & Hygiene

### 3.1 PostgreSQL Vacuuming & Vector Index Optimization
For production deployments on Render managed PostgreSQL:
```sql
-- Analyze table query statistics
VACUUM ANALYZE source_chunks;
VACUUM ANALYZE findings;
VACUUM ANALYZE audit_logs;

-- Reindex pgvector cosine index after large document ingestions
REINDEX INDEX source_chunks_embedding_idx;
```

### 3.2 Audit Log Archiving
To prevent the append-only `audit_logs` table from growing unbounded:
- Audit records should be archived annually into long-term cloud cold storage (e.g. S3 / GCS).
- Export records via `GET /api/audit/export?before=2026-01-01` to retain CSV archives before truncating legacy records.

---

## 4. Credential and Secret Rotation

- **JWT Secret Rotation**:
  When rotating `JWT_SECRET`, active user sessions are invalidated, requiring users to log in again. Schedule secret rotation during low-traffic maintenance windows.
- **Groq API Key Rotation**:
  Rotate Groq API keys via the Render Environment dashboard. The change takes effect upon automatic container restart without downtime.

---

## 5. Dependency Updates and Security Auditing

Perform monthly dependency health checks:

```bash
# Backend Security Audit
cd backend
pip install pip-audit
pip-audit

# Frontend Package Audit
cd ../frontend
npm audit
npm outdated
```
