# BrandGuard System Architecture

## 1. High-Level Architecture Overview

BrandGuard is an explainable, pre-publish brand governance system built with a decoupled architecture:
- **Presentation Layer**: Next.js 14 frontend utilizing Tailwind CSS for modern responsive interfaces with light/dark theme support.
- **Application Layer**: High-performance FastAPI backend delivering RESTful APIs, asynchronous validation pipelines, and dependency injection.
- **Storage Layer**: Dual-mode persistence layer featuring PostgreSQL with the `pgvector` extension for production semantic similarity search, and an automatic SQLite fallback for local development.
- **Intelligence Layer**: Hybrid pipeline pairing a fast, deterministic rule engine (regex, WCAG luminance, syllable counters) with a retrieval-augmented Groq LLM (`llama-3.3-70b-versatile`) generating structured JSON verdicts.
- **Privacy Layer**: Pre-flight regex masking and computer vision redaction ensuring no raw PII, credentials, or sensitive facial/screen imagery ever leave boundary controls.

```
+-------------------------------------------------------------------------+
|                           Client Browser                                |
|   Next.js 14 UI (Dashboard, DraftViewer, ReviewQueue, InsightsCharts)   |
+------------------------------------+------------------------------------+
                                     | HTTP/REST (JSON & FormData)
                                     v
+-------------------------------------------------------------------------+
|                        FastAPI Gateway (Uvicorn)                        |
|   Routers: /auth, /drafts, /findings, /reviews, /checks, /insights,     |
|            /audit, /sources, /chatbot, /voice                           |
+------------------------------------+------------------------------------+
                                     |
           +-------------------------+-------------------------+
           |                                                   |
           v                                                   v
+-----------------------+                           +---------------------+
| Deterministic Engine  |                           |  AI Pipeline Layer  |
| - Banned Term Regex   |                           | - PII Redaction     |
| - Readability Metric  |                           | - Semantic Embeds   |
| - WCAG Contrast 2.1   |                           | - Vector Retrieval  |
| - Accessibility Check |                           | - Groq LLM Review   |
+-----------+-----------+                           +----------+----------+
            |                                                  |
            +-------------------------+------------------------+
                                      v
+-------------------------------------------------------------------------+
|                           Persistence Engine                            |
|             SQLAlchemy ORM (Async-compatible session mgmt)             |
|   - PostgreSQL + pgvector (Production)                                  |
|   - SQLite in-process DB (Development / Offline Fallback)               |
+-------------------------------------------------------------------------+
```

---

## 2. Component Subsystems

### 2.1 Backend Pipeline Orchestration (`backend/app/services/review_pipeline.py`)
The central review coordinator executes a structured pipeline across any submitted text or image asset:
1. **Pre-Flight Redaction**: Sensitive patterns (API tokens, emails, phone numbers) are stripped or replaced with safe tokens before external dispatch.
2. **Deterministic Pre-Screening**: Immediate local execution of prohibited terms, superlative claim regexes, readability scores, and color contrast.
3. **Semantic Chunk Retrieval**: Queries existing vector embeddings for brand guidelines, fact sheets, and legal policies to pull top-$k$ relevant chunks.
4. **Structured LLM Assessment**: Formulates an enriched prompt to Groq, returning findings strictly formatted in JSON referencing specific chunk IDs.
5. **Finding Synthesis & Storage**: Merges deterministic and AI findings into database records with confidence ratings and suggested rewrites.
6. **Audit Event Dispatch**: Emits an immutable log entry in the audit repository recording the timestamp, draft ID, and actor.

### 2.2 Frontend Architecture (`frontend/src`)
The UI is organized into modular presentation components and centralized state stores:
- **AppShell**: Standard navigation, persona switcher, theme toggle, and responsive container.
- **DraftViewer & FindingCard**: Real-time inspection of draft content alongside interactive finding cards. Users can accept, edit, or dispute findings.
- **AutoRewriteModal**: Interactive modal providing instant guideline-aligned copy alternatives with side-by-side diffing.
- **PredictiveScoreCard**: Displays live compliance scores calculated across Tone, Accuracy, Legal Risk, and Accessibility.
- **MultimodalGovernanceSection**: Renders OCR extracted text, visual palette anomalies, and redacted image previews.

### 2.3 Vector Storage and Retrieval Subsystem
- **Embeddings**: Utilizes 384-dimensional dense vectors generated through SentenceTransformers or lightweight cosine-based fallbacks.
- **Postgres pgvector**: Operates indexed cosine distance searches (`<=>`) for enterprise-scale document chunk retrieval.
- **SQLite Fallback**: Operates vector similarity in memory when PostgreSQL is unavailable, enabling complete local evaluation without external database dependencies.

---

## 3. Communication and Data Flow

```
[User Draft Submission]
          │
          ▼
┌──────────────────┐
│ PII Redaction    │  ── (Strips secrets, emails, phones)
└─────────┬────────┘
          ▼
┌──────────────────┐
│ Deterministic    │  ── (Banned terms, Readability, WCAG contrast)
│ Rule Execution   │
└─────────┬────────┘
          ▼
┌──────────────────┐
│ Vector Search    │  ── (Retrieves relevant Guideline & Fact Chunks)
└─────────┬────────┘
          ▼
┌──────────────────┐
│ Groq LLM Call    │  ── (Generates structured JSON findings & chunk citations)
└─────────┬────────┘
          ▼
┌──────────────────┐
│ Synthesis & DB   │  ── (Persists findings, updates draft status)
└─────────┬────────┘
          ▼
┌──────────────────┐
│ Audit Logging    │  ── (Writes append-only audit event)
└──────────────────┘
```

---

## 4. Resilience and Fallback Strategies

| Layer | Primary Strategy | Fallback Strategy |
|---|---|---|
| **Database** | PostgreSQL with `pgvector` | Local SQLite database (`sqlite:///./brandguard.db`) |
| **LLM Inference** | Groq `llama-3.3-70b-versatile` | Local rule-based finding synthesis and heuristics |
| **Embeddings** | In-memory 384-dim semantic embeddings | Keyword and token overlap similarity |
| **OCR Processing** | Tesseract OCR / EasyOCR | Text-only document analysis with warning banner |
| **Frontend Rendering** | Next.js Static Export (`./out`) on CDN | Dynamic client-side routing with localStorage cache |
