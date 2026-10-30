# Technical Specification: Terminology Validation and Glossary Synchronization

## 1. Overview and Storage Design

Corporate terminology is a living system. As trademarks are registered, legacy systems phased out, and legal guidelines revised, terminology dictionaries must update dynamically without requiring code redeployments or server restarts.

The **Terminology Validation Subsystem** couples a static pre-seeded JSON dictionary (`backend/app/seed/glossary.json`) with a dynamic database-backed glossary index.

```
+--------------------------------------------------------------------------+
|                  Static Definition: glossary.json                        |
|   Contains base seed terms: HyperSync, MegaCloud, SOC2 Type II, etc.     |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Database Glossary Table / Source Chunks                 |
|   Stores tenant-specific, dynamic terms with workspace isolation         |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Compiled In-Memory Regex Pattern Cache                  |
|   Pre-compiles word-boundary patterns for sub-millisecond execution      |
+------------------------------------+-------------------------------------+
                                     |
                                     v
+--------------------------------------------------------------------------+
|                  Real-Time Terminology Validator                         |
|   Evaluates draft tokens against banned, preferred, and required terms   |
+--------------------------------------------------------------------------+
```

---

## 2. Glossary Schema Specification

Each term in the glossary adheres to the following JSON structure:

```json
{
  "term": "HyperSync",
  "type": "banned",
  "replacement": "Acme LiveSync",
  "note": "HyperSync was phased out in 2024. Use Acme LiveSync exclusively.",
  "workspace_id": "ws_default"
}
```

### 2.1 Terminology Types
- **`banned`**: Terms that must never appear in customer-facing content. Triggers a `HIGH` or `CRITICAL` finding. Always accompanied by an approved `replacement`.
- **`preferred`**: Recommended official product or trademark phrasing (e.g. *Acme Enterprise Hub*). Used to nudge copywriters toward consistent brand vocabulary.
- **`required`**: Mandatory qualifier terms that must accompany specific claims (e.g., mentioning "SOC 2" requires specifying "SOC 2 Type II").

---

## 3. Dynamic Synchronization & Pattern Compilation

To maintain sub-10ms response times:
1. **Startup Compilation**: On server initialization, the service loads all terms belonging to the workspace and compiles a single aggregated regex pattern:
   ```python
   escaped_terms = [re.escape(t.term) for t in terms]
   pattern = re.compile(rf"\b({'|'.join(escaped_terms)})\b", flags=re.IGNORECASE)
   ```
2. **Dynamic Invalidation**: When an administrator adds or updates a term via `POST /api/sources`, an invalidation hook re-compiles the in-memory pattern without restarting the application container.
3. **Multi-Tenant Isolation**: Terms are partitioned by `workspace_id`, ensuring enterprise tenants cannot view or enforce external organizations' private glossaries.

---

## 4. Remediation Workflow

When a banned term is detected:
1. A `Finding` record is created with `status: PENDING`.
2. The user sees the violation highlighted in `DraftViewer.jsx`.
3. Clicking **Accept Rewrite** triggers an atomic text update replacing the flagged term with the approved `replacement`.
4. The finding status transitions to `ACCEPTED`, and an audit event is recorded.
