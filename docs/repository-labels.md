# Repository Labels and Taxonomy Guide

BrandGuard organizes issues, discussions, and pull requests using a consistent, structured taxonomy of GitHub labels.

---

## 1. Type Labels (`type: *`)
Classify the functional intent of the issue or pull request:

| Label | Color | Description |
|---|:---:|---|
| `type: bug` | `#d73a4a` | Something isn't working as intended. |
| `type: feature` | `#a2eeef` | New user capability or compliance check. |
| `type: docs` | `#0075ca` | Improvements or additions to documentation. |
| `type: performance`| `#d4c5f9` | Latency reduction, query optimization, or bundle shrinkage. |
| `type: security` | `#b60205` | Vulnerability patch or security enhancement. |
| `type: refactor` | `#cfd3d7` | Code restructuring without altering external functionality. |

---

## 2. Priority Labels (`priority: *`)
Indicate scheduling urgency for triage:

| Label | Level | SLA Target |
|---|:---:|---|
| `priority: critical (P0)` | Critical | Immediate escalation; blocking production deployments. |
| `priority: high (P1)` | High | Resolved in the current sprint. |
| `priority: medium (P2)` | Medium | Standard backlog prioritization. |
| `priority: low (P3)` | Low | Minor improvement or cosmetic refinement. |

---

## 3. Component Labels (`component: *`)
Identify the subsystem affected:

| Label | Target Subsystem |
|---|---|
| `component: backend` | FastAPI routers, services, or dependency injection. |
| `component: frontend` | Next.js pages, Tailwind components, or client state. |
| `component: ai-rag` | Groq integration, vector embeddings, chunking, or ClaimCheck. |
| `component: checks` | Deterministic checks (banned terms, readability, WCAG contrast). |
| `component: database` | SQLAlchemy models, PostgreSQL pgvector, or SQLite fallback. |
| `component: deploy` | Render blueprints, environment variables, or build configs. |

---

## 4. Community Labels
- `good first issue`: Ideal for new contributors looking to make their first contribution.
- `help wanted`: Maintainers are actively seeking community contribution on this item.
