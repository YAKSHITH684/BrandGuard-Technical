# Frequently Asked Questions (FAQ)

## 1. General Questions

### What is BrandGuard?
BrandGuard is an explainable, pre-publish brand governance system. It intercepts draft marketing copy, announcements, and visual assets before publication to verify brand voice, legal terminology, factual claims, and accessibility compliance.

### How does BrandGuard differ from generic grammar checkers like Grammarly?
Standard grammar tools check generic English spelling and punctuation. BrandGuard enforces **proprietary enterprise brand rules**:
- Catches deprecated product names (e.g. *HyperSync* vs *Acme LiveSync*).
- Audits factual benchmarks and SLAs against date-bounded corporate fact sheets.
- Enforces trademark guidelines, competitor disparagement rules, and WCAG accessibility standards.
- Every finding cites an exact company guideline excerpt with human-in-the-loop approval workflows.

---

## 2. Artificial Intelligence and LLM Usage

### Which LLM powers BrandGuard?
BrandGuard uses **Groq** (`llama-3.3-70b-versatile`) running on specialized Language Processing Units (LPUs) to generate structured JSON reviews in 400–800ms.

### Does BrandGuard train foundation models on our private drafts?
**No.** All requests to Groq are strictly stateless API inferences under enterprise data protection terms. Furthermore, BrandGuard runs a zero-leak regex privacy filter (`redaction.py`) that strips PII, emails, API keys, and credentials before any text leaves the server.

### What happens if the Groq API is offline or rate-limited?
BrandGuard is engineered with a **deterministic-first architecture**. If Groq is unavailable, the deterministic rule engine (banned words, claim patterns, readability formulas, WCAG color contrast) continues running normally and returns rule-based findings without failing.

---

## 3. Factual Verification (ClaimCheck)

### How does ClaimCheck distinguish between "Supported" and "Outdated" claims?
Every chunk in the corporate fact sheet contains `effective_date` and `expiry_date` metadata.
- If an assertion matches an active benchmark whose expiry date has not passed, it is tagged **`Supported`**.
- If an assertion matches a historical benchmark whose validity period has expired (e.g. quoting the 2023 99.85% SLA instead of the current 2025/2026 99.95% SLA), it is tagged **`Outdated`** and suggests the current figure.

### Can ClaimCheck verify claims inside images?
Yes. BrandGuard features a multimodal image governance pipeline. When an image banner or slide screenshot is uploaded, the OCR engine extracts the embedded text and submits it to ClaimCheck.

---

## 4. Hosting, Infrastructure & Security

### Why does the live Render demo sometimes take 30–60 seconds to respond initially?
The live demonstration is hosted on Render's free tier. Render spins down idle web services after 15 minutes of inactivity. The first incoming request wakes the container, which takes ~30–60 seconds. Once awake, all subsequent requests execute with sub-second latency.

### Do I need PostgreSQL installed to run BrandGuard locally?
**No.** BrandGuard includes an automatic SQLite fallback. If no `DATABASE_URL` is configured, it initializes `brandguard.db` in SQLite format and calculates vector embeddings in Python memory.

### Can a Content Creator approve their own draft?
**No.** BrandGuard's state machine strictly enforces separation of concerns. Creators can author drafts, dispute findings, and accept suggested rewrites, but only users with the `manager` or `reviewer` role can transition a draft to `APPROVED`.
