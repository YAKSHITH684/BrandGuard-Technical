# BrandGuard — Explainable Pre-Publish Brand Governance

**Inkloom AI Hackathon · Round 3: The Final**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-brandguard--technical.onrender.com-4f46e5?style=for-the-badge)](https://brandguard-technical.onrender.com)
[![Backend](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](#tech-stack)
[![Frontend](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](#tech-stack)
[![DB](https://img.shields.io/badge/PostgreSQL%20%2B%20pgvector-336791?style=flat-square&logo=postgresql&logoColor=white)](#tech-stack)

**BrandGuard** catches banned terms, outdated facts, and ungrounded superlatives **before** content goes live. Every finding cites the exact rule violated and the approved source excerpt behind it. Nothing is auto-applied: humans accept, edit, reject, or dispute each finding, and every action lands in an append-only audit trail.

## 🔗 Links

| | |
|---|---|
| **Live app** | https://brandguard-technical.onrender.com |
| **Repository** | https://github.com/YAKSHITH684/BrandGuard-Technical |
| **API docs (Swagger)** | `<backend-url>/docs` |

> **Note:** The app runs on Render's free tier. If it has been idle, the first request can take 30–60 seconds while the service wakes up. Open the live link once and wait for the landing page before testing.

---

## 🎯 Try It in 60 Seconds

1. Open the [live app](https://brandguard-technical.onrender.com).
2. Click an **Instant 1-Click Entrance** persona (no typing needed).
3. In the **Dashboard**, use the **ClaimCheck** scanner or a demo preset to analyze a draft (text or image).
4. Open a finding to see the cited guideline or fact-sheet chunk, confidence, and suggested rewrite.
5. Switch persona (Creator → Brand Manager → Legal) to walk through the approval flow.
6. Visit **Insights** and **Audit** to see the feedback loop and the exportable audit trail.

### Demo personas (pre-seeded)

| Persona | Email | Password | Role |
|---|---|---|---|
| **Alex Vance** | `creator@brandguard.io` | `password123` | **Creator**: submits drafts, reviews findings, accepts or disputes rewrites |
| **Elena Rostova** | `manager@brandguard.io` | `password123` | **Brand Manager**: ingests guidelines, monitors insights, approves standard drafts |
| **Marcus Sterling** | `reviewer@brandguard.io` | `password123` | **Legal Reviewer**: gated sign-off on sensitive claims and unsupported assertions |

---

## 🌟 Key Capabilities

### 1. Deterministic Rule Engine (no AI needed)
- Banned and required terminology enforcement
- Superlative and absolute-claim detection ("world's best", "#1", "fastest", "guaranteed", unqualified percentages)
- Readability analysis (Flesch Reading Ease, Flesch-Kincaid Grade Level)
- WCAG 2.1 AA color-contrast evaluator (4.5:1 text, 3:1 large text)
- Accessibility checks (generic link text such as "click here", missing alt text)

### 2. Grounded, Retrieval-Augmented Review
- Source ingestion for guidelines, fact sheets, and glossaries (PDF, DOCX, TXT, MD)
- Sectioned chunking with effective and expiry dates
- 384-dimensional semantic embeddings in pgvector (PostgreSQL), with SQLite fallback
- Structured JSON review via Groq (`llama-3.3-70b-versatile`) that cites exact source chunk IDs

### 3. ClaimCheck: Text and Images (OCR)
- Labels factual and promotional claims **Supported**, **Outdated**, or **Unsupported**, with the exact fact-sheet chunk and a confidence score
- Extracts claims embedded in graphics (banners, infographics, slide screenshots) via OCR
- One consistent verdict across written copy and images

### 4. Privacy Layer: Text and Images
- Pre-flight redaction of PII, secrets, and API keys before anything is sent to an external model
- Detects and irreversibly blurs faces, vehicle license plates, and visible confidential screen text in images
- AI involvement is disclosed on every finding and logged to the audit trail

### 5. Human-in-the-Loop Workflow
- Lifecycle: `DRAFT` → `IN_REVIEW` → `CHANGES_REQUESTED` → `DISPUTED` → `APPROVED`
- Version diff viewer between revisions
- Role-based approval queue: sensitive claims require Legal Reviewer sign-off

### 6. Guideline Feedback Loop (Insights and Visual Violations)
- Surfaces the most-overridden and most-disputed rules so ambiguous guidelines get fixed
- Aggregates visual violations: off-palette colors, wrong or distorted logos, low contrast, missing alt text
- Flags recurring agency mistakes (for example, repeated use of an outdated logo) with recommendations

### 7. Immutable Audit Trail
- Append-only event log covering redactions, OCR claim analyses, and approval decisions
- Exportable as RFC 4180 CSV

---

## 🏗️ Architecture

```
┌──────────────────────┐        ┌─────────────────────────────────────────┐
│  Next.js + Tailwind  │  REST  │               FastAPI                   │
│  Dashboard · Drafts  │ ─────▶ │  routers → services → pipeline          │
│  Reviews · Insights  │        │                                         │
│  Audit · Settings    │        │  ┌─────────────┐   ┌─────────────────┐  │
└──────────────────────┘        │  │ Deterministic│   │  AI pipeline    │  │
                                │  │ checks       │   │  Redaction      │  │
                                │  │ (terms,      │   │  Embeddings     │  │
                                │  │  claims,     │   │  Retrieval      │  │
                                │  │  contrast,   │   │  Groq (JSON)    │  │
                                │  │  readability)│   │  ClaimCheck/OCR │  │
                                │  └─────────────┘   └─────────────────┘  │
                                └───────────────┬─────────────────────────┘
                                                │
                                   PostgreSQL + pgvector
                                   (SQLite fallback for local dev)
```

**Review flow:** draft submitted → PII redacted → deterministic checks run → relevant source chunks retrieved by embedding similarity → Groq returns structured findings citing chunk IDs → findings shown with rewrites → human decision → audit event written.

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL + pgvector (SQLite fallback) |
| LLM | Groq, `llama-3.3-70b-versatile`, structured JSON output |
| Embeddings | 384-dimensional vectors |
| Deployment | Render (`render.yaml`) |

### 🤖 LLM: Groq

BrandGuard uses **Groq** (`llama-3.3-70b-versatile`) as its LLM provider.

- **Structured review:** returns JSON findings that cite exact source chunk IDs, so every verdict is grounded.
- **ClaimCheck:** classifies claims as Supported, Outdated, or Unsupported against the dated fact sheet, including text extracted from images via OCR.
- **Rewrites:** suggests intent-preserving rewrites that humans accept, edit, or reject.
- **Privacy first:** PII, secrets, and API keys are redacted before any text reaches Groq, and AI involvement is disclosed on every finding.
- **Graceful without it:** the deterministic rule engine runs with no LLM call at all.

---

## 🚀 Run Locally (no Docker)

**Windows quick start:** double-click `start.bat`, or run the two servers manually:

```bash
# Terminal 1 — backend
cd backend
pip install -r requirements.txt
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — frontend
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger docs: http://localhost:8000/docs

### Environment variables

| Variable | Purpose |
|---|---|
| `GROQ_API_KEY` | Groq LLM access for structured review |
| `DATABASE_URL` | PostgreSQL connection string (omit to use the SQLite fallback) |

Without a Groq key, the deterministic rule engine still runs.

---

## 🧪 Testing

```bash
cd backend
python test_suite.py                  # 17-step end-to-end integration test
python test_multimodal_logic.py       # image ClaimCheck, privacy blurring, visual insights
python e2e_test_suite.py              # full-flow end-to-end checks
```

---

## 📁 Repository Structure

```
brandguard/
├── backend/
│   ├── app/
│   │   ├── ai/            # Redaction, embeddings, retrieval, Groq client, ClaimCheck
│   │   ├── checks/        # Banned terms, claim patterns, readability, contrast, a11y
│   │   ├── models/        # SQLAlchemy models (pgvector compatible)
│   │   ├── routers/       # auth, sources, drafts, findings, reviews, checks, insights, audit
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── seed/          # Guidelines, fact sheet, glossary, seed script
│   │   ├── services/      # Business logic and pipeline orchestration
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py        # FastAPI entrypoint
│   └── test_suite.py
├── frontend/
│   └── src/
│       ├── components/    # AppShell, DraftViewer, FindingCard, ClaimBadge, VersionDiff, ReviewQueue, InsightsCharts
│       ├── pages/         # dashboard, drafts, sources, reviews, insights, audit, settings
│       └── services/      # API client
├── deploy/                # Deployment configuration
├── render.yaml            # Render blueprint
├── start.bat · run_backend.bat · run_frontend.bat
└── README.md
```

---

## 🗺️ Roadmap

- Flag overlays drawn directly on images (bounding boxes by severity)
- Rule impact simulator: preview which past drafts flip pass/fail when a guideline changes
- Publish-gate API for CMS and CI integration
- Multilingual checks (Hindi, Telugu)
- Auto-fix suggestions with side-by-side diff
- Tamper-evident (hash-chained) audit log

---

## 📄 License

Built for the Inkloom AI Hackathon.
    └── src/
        ├── components/    # AppShell, DraftViewer, FindingCard, ClaimBadge, VersionDiff, ReviewQueue, InsightsCharts
        ├── pages/         # Next.js pages (dashboard, drafts, sources, reviews, insights, audit, settings)
        └── services/      # Frontend API client
```
