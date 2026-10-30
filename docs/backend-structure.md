# Backend Architecture and Structure

## 1. Overview

BrandGuard's backend is implemented in Python 3.12 using the **FastAPI** framework, chosen for its high-throughput asynchronous execution, native OpenAPI/Swagger documentation generation, and strict type validation via Pydantic.

```
backend/
├── app/
│   ├── ai/               # AI & ML integrations (Groq client, OCR, embeddings, redaction)
│   ├── checks/           # Deterministic compliance rules (terms, claims, contrast, readability)
│   ├── models/           # SQLAlchemy ORM database models
│   ├── routers/          # FastAPI HTTP route handlers
│   ├── schemas/          # Pydantic data validation and serialization models
│   ├── seed/             # Default guidelines, fact sheets, glossaries, and demo data
│   ├── services/         # Core business logic and workflow coordinators
│   ├── config.py         # Application configuration and environment variable loading
│   ├── database.py       # SQLAlchemy engine, session maker, and DB dialect management
│   └── main.py           # Application entrypoint, middleware, and lifespan lifecycle
├── tests/                # Automated pytest test suites
├── requirements.txt      # Python runtime dependencies
└── run_backend.bat       # Windows local execution script
```

---

## 2. Directory Breakdown

### 2.1 Entrypoint and Configuration
- **`app/main.py`**: Initializes the FastAPI application instance. Configures CORS middleware to allow cross-origin communication from the Next.js frontend (`FRONTEND_URL`), registers all modular routers under the `/api` prefix, and manages the application lifespan to auto-seed initial guidelines and fact sheets on first run.
- **`app/config.py`**: Manages environment variables using `pydantic-settings`. Configures database connection strings, JWT secret tokens, Groq credentials, confidence thresholds, and frontend URL targets.
- **`app/database.py`**: Initializes the SQLAlchemy engine. Detects whether the active connection is PostgreSQL (enabling pgvector extension) or SQLite (enabling in-memory cosine fallback), providing a unified session dependency (`get_db`) for route injection.

### 2.2 Routers (`app/routers/`)
Routers map incoming HTTP requests to business service functions and return structured Pydantic schemas:
- **`auth.py`**: Manages user authentication, including standard email/password registration, JWT issuance, and instant 1-click persona switching for demo workflows.
- **`drafts.py`**: Handles draft creation, text and image uploads, draft retrieval by ID, version history diffing, and triggering automated reviews.
- **`findings.py`**: Enables creators and reviewers to inspect finding details, update resolution status (accept, edit, reject, dispute), and attach explanatory notes.
- **`reviews.py`**: Exposes the centralized review queue for Brand Managers and Legal Reviewers, handling gated status transitions (`IN_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`).
- **`checks.py`**: Provides standalone, stateless endpoints for on-the-fly verification of readability, WCAG color contrast, accessibility, and banned terms.
- **`sources.py`**: Handles ingestion and indexing of brand guidelines, fact sheets, and legal glossaries.
- **`insights.py`**: Serves aggregated analytics, including guideline dispute rates, frequent brand rule violations, and agency performance patterns.
- **`audit.py`**: Delivers the append-only event log and handles on-demand RFC 4180 CSV exports.
- **`chatbot.py`**: Implements an interactive brand governance assistant powered by Groq to answer real-time questions about company policies.
- **`voice.py`**: Processes audio dictation streams and converts speech into draft copy.

### 2.3 Services (`app/services/`)
Services contain core domain logic decoupled from HTTP transport:
- **`review_pipeline.py`**: Coordinates the multi-step verification pipeline: pre-flight redaction, deterministic checks, vector retrieval, Groq structured assessment, finding deduplication, and score calculation.
- **`auto_rewrite.py`**: Generates high-confidence, intent-preserving rewrite suggestions that resolve identified compliance violations while matching the brand tone.
- **`predictive_scoring.py`**: Calculates multi-dimensional compliance indices across Tone, Factual Accuracy, Legal Risk, and Accessibility.
- **`workflow.py`**: Enforces the human-in-the-loop state machine rules for draft progression and role permissions.
- **`ingestion.py`**: Parses incoming PDF, DOCX, Markdown, and TXT source files, splits content into semantically coherent chunks, and indexes vector embeddings.
- **`audit.py`**: Emits immutable records for all security, review, and administrative actions.

### 2.4 Deterministic Checks (`app/checks/`)
Fast, rule-based validators that execute with zero network latency:
- **`banned_terms.py`**: Regex and dictionary lookup against prohibited terminology and outdated brand names.
- **`claim_patterns.py`**: Detects unverified superlatives ("best", "#1", "fastest") and absolute performance guarantees.
- **`readability.py`**: Calculates Flesch Reading Ease score and Flesch-Kincaid Grade Level using exact syllable counting algorithms.
- **`contrast.py`**: Evaluates WCAG 2.1 AA luminance ratios between foreground and background hexadecimal colors.
- **`accessibility.py`**: Identifies non-descriptive hyperlink anchors and checks image assets for missing alt text.
- **`visual.py`**: Analyzes uploaded visual assets for brand palette compliance and logo integrity.

### 2.5 AI & Intelligence Modules (`app/ai/`)
- **`claimcheck.py`**: Evaluates factual statements against dated fact-sheet chunks and tags claims as Supported, Outdated, or Unsupported.
- **`llm_client.py`**: Interfaces with Groq via high-speed API endpoints utilizing `llama-3.3-70b-versatile` with JSON schema enforcement.
- **`embeddings.py`**: Generates 384-dimensional dense vector embeddings for ingested documents and draft queries.
- **`retrieval.py`**: Performs cosine similarity nearest-neighbor lookups across stored source chunks.
- **`redaction.py`**: Regex-driven zero-leak privacy filter masking emails, phone numbers, API keys, and credentials.
- **`image_redaction.py`**: Blurs faces, vehicle plates, and confidential screen elements in visual assets.
- **`ocr.py`**: Extracts text from visual draft images using optical character recognition.
- **`prompts.py`**: Encapsulates hardened system prompts and few-shot examples for structured LLM reviews.

---

## 3. Database Models (`app/models/`)
SQLAlchemy ORM models defining the relational and vector schema:
- **`User`**: User identity, hashed passwords, assigned workspace, and role (`creator`, `manager`, `reviewer`).
- **`Workspace`**: Tenant boundary grouping users, drafts, guidelines, and audit logs.
- **`Source` & `SourceChunk`**: Reference source documents, parsed text chunks, effective/expiry timestamps, and vector embeddings.
- **`Draft` & `DraftVersion`**: Content drafts, status state machine values, revision history, and calculated scores.
- **`Finding`**: Compliance violations linked to drafts, citing source chunk IDs, confidence values, and proposed rewrites.
- **`Approval`**: Multi-role review sign-offs with reviewer notes and timestamps.
- **`AuditLog`**: Append-only log of system events for compliance auditing.
