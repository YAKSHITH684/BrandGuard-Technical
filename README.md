# BrandGuard — Explainable Pre-Publish Brand Governance

**Inkloom AI Hackathon · Round 3: The Final**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-brandguard--technical.onrender.com-4f46e5?style=for-the-badge)](https://brandguard-technical.onrender.com)
[![Backend](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](#tech-stack)
[![Frontend](https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white)](#tech-stack)
[![DB](https://img.shields.io/badge/PostgreSQL%20%2B%20pgvector-336791?style=flat-square&logo=postgresql&logoColor=white)](#tech-stack)
[![Documentation](https://img.shields.io/badge/Docs-Comprehensive%20Catalog-green?style=flat-square)](docs/README.md)

**BrandGuard** catches banned terms, outdated facts, and ungrounded superlatives **before** content goes live. Every finding cites the exact rule violated and the approved source excerpt behind it. Nothing is auto-applied: humans accept, edit, reject, or dispute each finding, and every action lands in an append-only audit trail.

---

## 🔗 Quick Links

| Resource | Description | URL |
|---|---|---|
| **Live Application** | Production deployment on Render | [brandguard-technical.onrender.com](https://brandguard-technical.onrender.com) |
| **Source Code** | GitHub repository | [github.com/YAKSHITH684/BrandGuard-Technical](https://github.com/YAKSHITH684/BrandGuard-Technical) |
| **Interactive API Docs** | FastAPI Swagger UI | `<backend-url>/docs` (or `http://localhost:8000/docs`) |
| **Documentation Index** | Complete documentation directory | [docs/README.md](docs/README.md) |
| **Architecture Guide** | End-to-end system architecture | [docs/architecture.md](docs/architecture.md) |
| **API Usage Guide** | REST endpoints and payloads | [docs/api-usage.md](docs/api-usage.md) |
| **Deployment Guide** | Render static site + web service | [deploy/render_guide.md](deploy/render_guide.md) |

> **Note:** The app runs on Render's free tier. If it has been idle, the first request can take 30–60 seconds while the service wakes up. Open the live link once and wait for the landing page before testing.

---

## 🎯 Try It in 60 Seconds

1. Open the [live app](https://brandguard-technical.onrender.com).
2. Click an **Instant 1-Click Entrance** persona (no typing needed).
3. In the **Dashboard**, use the **ClaimCheck** scanner or a demo preset to analyze a draft (text or image).
4. Open a finding to see the cited guideline or fact-sheet chunk, confidence, and suggested rewrite.
5. Switch persona (Creator → Brand Manager → Legal) to walk through the approval flow.
6. Visit **Insights** and **Audit** to see the feedback loop and the exportable audit trail.

### Demo Personas (Pre-Seeded)

| Persona | Email | Password | Role & Permissions |
|---|---|---|---|
| **Alex Vance** | `creator@brandguard.io` | `password123` | **Creator**: Submits drafts, reviews findings, accepts or disputes rewrites |
| **Elena Rostova** | `manager@brandguard.io` | `password123` | **Brand Manager**: Ingests guidelines, monitors insights, approves standard drafts |
| **Marcus Sterling** | `reviewer@brandguard.io` | `password123` | **Legal Reviewer**: Gated sign-off on sensitive claims and unsupported assertions |

---

## 🌟 Key Capabilities

### 1. Deterministic Rule Engine (No AI Needed)
- Banned and required terminology enforcement with fuzzy and exact word-boundary matching
- Superlative and absolute-claim detection ("world's best", "#1", "fastest", "guaranteed", unqualified percentages)
- Readability analysis via Flesch Reading Ease and Flesch-Kincaid Grade Level formulas
- WCAG 2.1 AA color-contrast evaluator (4.5:1 text, 3:1 large text)
- Accessibility checks (generic link text such as "click here", missing image alt text)

### 2. Grounded, Retrieval-Augmented Review
- Source ingestion for guidelines, fact sheets, and glossaries (PDF, DOCX, TXT, MD)
- Sectioned chunking preserving effective and expiry dates
- 384-dimensional semantic embeddings stored in pgvector (PostgreSQL), with SQLite fallback
- Structured JSON review via Groq (`llama-3.3-70b-versatile`) citing exact source chunk IDs

### 3. ClaimCheck: Text and Images (OCR)
- Classifies factual and promotional claims as **Supported**, **Outdated**, or **Unsupported**
- Matches claims against time-bounded fact-sheet assertions with confidence scores
- Extracts claims embedded in graphics (banners, infographics, slide screenshots) via OCR
- Delivers a unified verdict across written copy and visual assets

### 4. Zero-Leak Privacy Layer
- Pre-flight regex masking of PII, secrets, and API keys before sending prompts to LLM
- Automated detection and irreversible blurring of faces, license plates, and confidential screen text in images
- Explicit AI disclosure metadata stamped on every finding and logged to the audit log

### 5. Predictive Compliance Scoring & AI Auto-Rewrite
- Pre-computes compliance scores across brand tone, factual accuracy, legal risk, and accessibility
- One-click context-aware AI rewrite assistant generating compliant alternatives
- Side-by-side diff comparison between original draft and proposed revision

### 6. Human-in-the-Loop Workflow
- Deterministic finite state machine: `DRAFT` → `IN_REVIEW` → `CHANGES_REQUESTED` → `DISPUTED` → `APPROVED`
- Version diff viewer between revisions
- Role-based approval queue: high-risk claims require Legal Reviewer sign-off

### 7. Guideline Feedback Loop & Visual Insights
- Surfaces the most-overridden and most-disputed rules so ambiguous guidelines get updated
- Aggregates visual violations: off-palette colors, wrong or distorted logos, low contrast, missing alt text
- Flags recurring agency mistakes with data-backed recommendations

### 8. Immutable Audit Trail
- Append-only event log covering redactions, OCR analyses, overrides, and approvals
- RFC 4180 CSV export for regulatory and compliance audits

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

**Review Flow:** Draft submitted → PII redacted → Deterministic checks run → Relevant source chunks retrieved by embedding similarity → Groq returns structured findings citing chunk IDs → Findings shown with rewrites → Human decision → Audit event written.

---

## 🧰 Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | Next.js 14, Tailwind CSS | Pages router, responsive layout, dark/light theme |
| **Backend** | FastAPI, Python 3.12, Uvicorn | Async endpoints, dependency injection, Pydantic schemas |
| **Database** | PostgreSQL + pgvector | High-performance vector similarity, SQLite fallback |
| **LLM Inference** | Groq (`llama-3.3-70b-versatile`) | Ultra-fast inference with structured JSON mode |
| **Embeddings** | Sentence Transformers | 384-dimensional vector embeddings |
| **Deployment** | Render (`render.yaml`) | Next.js Static Site + FastAPI Web Service |

---

## 🚀 Run Locally (No Docker)

### Windows Quick Start
Double-click `start.bat` in the repository root, or run the two servers manually in separate terminals:

```bash
# Terminal 1 — Backend
cd backend
pip install -r requirements.txt
py -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 — Frontend
cd frontend
npm install
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:8000
- **Interactive Swagger Docs:** http://localhost:8000/docs

### Environment Variables

| Variable | Required | Description | Default |
|---|---|---|---|
| `GROQ_API_KEY` | Optional | Groq LLM access for structured review and rewrites | None (runs rule engine only) |
| `DATABASE_URL` | Optional | PostgreSQL connection string | `sqlite:///./brandguard.db` |
| `JWT_SECRET` | Optional | Secret key for JWT token signing | Pre-configured dev secret |
| `CONFIDENCE_THRESHOLD` | Optional | Minimum confidence score for claim validation | `0.65` |

---

## 🧪 Testing

Execute test suites from the `backend/` directory:

```bash
cd backend
python test_suite.py                  # 17-step end-to-end integration test
python test_multimodal_logic.py       # Image ClaimCheck, privacy blurring, visual insights
python e2e_test_suite.py              # Full-flow end-to-end verification
python test_user_scenarios.py         # Multi-persona workflow scenarios
```

---

## 📁 Repository Structure

```
brandguard/
├── backend/
│   ├── app/
│   │   ├── ai/            # Redaction, embeddings, retrieval, Groq client, ClaimCheck, OCR
│   │   ├── checks/        # Banned terms, claim patterns, readability, contrast, visual, a11y
│   │   ├── models/        # SQLAlchemy models (pgvector compatible)
│   │   ├── routers/       # auth, sources, drafts, findings, reviews, checks, insights, audit, chatbot, voice
│   │   ├── schemas/       # Pydantic schemas for request validation & serialization
│   │   ├── seed/          # Guidelines, fact sheet, glossary, demo seed scripts
│   │   ├── services/      # Business logic, auto-rewrite, predictive scoring, review pipeline
│   │   ├── config.py      # App configuration and settings
│   │   ├── database.py    # Database engine and session management
│   │   └── main.py        # FastAPI entrypoint and lifespan events
│   ├── tests/             # Automated test cases
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/    # AppShell, DraftViewer, FindingCard, MultimodalGovernance, etc.
│   │   ├── pages/         # Next.js pages (dashboard, drafts, sources, reviews, insights, audit, settings, voice)
│   │   ├── services/      # API client
│   │   ├── store/         # State management (auth, theme)
│   │   └── styles/        # Global CSS and Tailwind definitions
│   └── package.json       # Frontend dependencies
├── deploy/                # Render deployment guide and scripts
├── docs/                  # Detailed architectural and technical documentation
├── render.yaml            # Render blueprint definition
├── start.bat              # Windows combined launcher
└── README.md              # Project overview
```

---

## 🗺️ Roadmap

- [ ] Flag overlays drawn directly on images (bounding boxes by severity)
- [ ] Rule impact simulator: preview which past drafts flip pass/fail when a guideline changes
- [ ] Publish-gate API and webhook for CMS and CI/CD integration
- [ ] Multilingual checks (Hindi, Spanish, German, Japanese)
- [ ] Tamper-evident hash-chained audit log verification

---

## 📄 License & Attributions

Built for the **Inkloom AI Hackathon · Round 3: The Final**.
Protected under the MIT License.
