# BrandGuard — Explainable Pre-Publish Brand Governance
### Inkloom AI Hackathon · Round 2: The Build

**BrandGuard** is a full-stack, explainable brand governance platform that empowers creators to submit drafts and receive verifiable findings *before* content goes live.

Every finding is grounded in approved workspace sources (guidelines, dated fact sheets, glossary rules), shows the exact rule violated, cites the source excerpt, scores confidence, and offers intent-preserving rewrites. Nothing is auto-applied: humans accept, edit, reject, or dispute findings, and every action is recorded into an immutable audit trail.

---

## 🌟 Key Capabilities

1. **Deterministic Rule Engine (No AI Needed)**
   - Banned & required terminology enforcement
   - Superlatives & absolute claim detection ("world's best", "#1", "fastest", "guaranteed", unqualified percentages)
   - Readability analysis (Flesch Reading Ease & Flesch-Kincaid Grade Level)
   - WCAG 2.1 AA Color Contrast evaluator (4.5:1 text, 3:1 large text)
   - Accessibility checker (generic link text like "click here", missing alt text)

2. **Grounding & Retrieval-Augmented Review**
   - Source ingestion for guidelines, fact sheets, and glossaries (PDF, DOCX, TXT, MD)
   - Splits content into sectioned chunks with effective and expiry dates
   - 384-dimensional semantic embeddings stored in pgvector (PostgreSQL) with SQLite fallback
   - Structured JSON review via Groq LLM (`llama-3.3-70b-versatile`) citing exact source chunk IDs

3. **ClaimCheck (Factual Freshness)**
   - Labels factual claims as **Supported**, **Outdated**, or **Unsupported**
   - Flags expired benchmarks when `expires_on` has passed

4. **Privacy Layer**
   - Client-side redaction detects emails, phone numbers, credit cards, national IDs, and API keys before invoking external models

5. **Human-in-the-Loop Workflow & Approvals**
   - Lifecycle: `DRAFT` → `IN_REVIEW` → `CHANGES_REQUESTED` → `DISPUTED` → `APPROVED`
   - Version diff viewer highlights changes between revisions
   - Role-based approval queue (Sensitive claims require Legal Reviewer approval)

6. **Guideline Feedback Loop (Insights)**
   - Tracks most-overridden rules (highest dispute/reject rate) to flag unclear guidelines
   - Top violations by category and claim integrity distribution

7. **Immutable Audit Trail**
   - Append-only event log exportable as RFC 4180 CSV

---

## 🚀 Quick Start (No Docker Required)

### 1. Launch Servers
Double-click `start.bat` or run:
```bash
# Terminal 1 - Backend
cd backend
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend
cd frontend
npm run dev
```

- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **FastAPI Backend:** [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 👥 Demo Personas (Pre-seeded)

Use the one-click demo login buttons on `/login` or enter credentials:

| Persona | Email | Password | Role Description |
|---|---|---|---|
| **Alex Vance** | `creator@brandguard.io` | `password123` | **Creator** — Submits drafts, reviews findings, accepts/disputes rewrites |
| **Elena Rostova** | `manager@brandguard.io` | `password123` | **Brand Manager** — Ingests guidelines, monitors insights, approves standard drafts |
| **Marcus Sterling** | `reviewer@brandguard.io` | `password123` | **Legal Reviewer** — Gated sign-off on sensitive claims & unsupported assertions |

---

## 📁 Repository Structure
```
brandguard/
├── backend/
│   ├── app/
│   │   ├── ai/            # Redaction, embeddings, retrieval, Groq client, ClaimCheck
│   │   ├── checks/        # Deterministic checks (banned terms, claim patterns, readability, contrast, a11y)
│   │   ├── models/        # SQLAlchemy models (pgvector compatible)
│   │   ├── routers/       # FastAPI endpoints (auth, sources, drafts, findings, reviews, checks, insights, audit)
│   │   ├── schemas/       # Pydantic validation schemas
│   │   ├── seed/          # Guidelines, fact sheet, glossary & seed script
│   │   ├── services/      # Business logic & pipeline orchestrators
│   │   ├── config.py      # App settings
│   │   ├── database.py    # Database connection & init
│   │   └── main.py        # FastAPI entrypoint
│   └── test_suite.py      # 17-step end-to-end integration tests
└── frontend/
    └── src/
        ├── components/    # AppShell, DraftViewer, FindingCard, ClaimBadge, VersionDiff, ReviewQueue, InsightsCharts
        ├── pages/         # Next.js pages (dashboard, drafts, sources, reviews, insights, audit, settings)
        └── services/      # Frontend API client
```
