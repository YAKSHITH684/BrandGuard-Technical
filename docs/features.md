# BrandGuard Feature Catalog

## 1. Feature Matrix Overview

BrandGuard provides an end-to-end suite of pre-publish compliance, brand governance, and legal risk mitigation capabilities:

| Feature Area | Key Capability | Implementation Module | User Role Beneficiary |
|---|---|---|---|
| **Deterministic Rules** | Zero-latency banned word, claim pattern, contrast, and readability checks | `backend/app/checks/` | Creators, Brand Managers |
| **Grounded Review** | Retrieval-augmented evaluation citing verified source chunks | `backend/app/ai/retrieval.py` | All Roles |
| **ClaimCheck** | 3-tier factual verification (Supported / Outdated / Unsupported) | `backend/app/ai/claimcheck.py` | Legal Reviewers, Creators |
| **Privacy Layer** | Pre-flight PII masking & automated image blurring (faces/screens) | `backend/app/ai/redaction.py` | Compliance Officers |
| **Predictive Scoring** | Real-time compliance gauges across Tone, Accuracy, Legal, and A11y | `backend/app/services/predictive_scoring.py` | Creators, Brand Managers |
| **AI Auto-Rewrite** | One-click, intent-preserving rewrite generator with diff viewer | `backend/app/services/auto_rewrite.py` | Creators |
| **Multimodal Governance** | OCR claim extraction, visual palette audit, and logo integrity | `backend/app/checks/visual.py` | Brand Designers |
| **Voice Dictation** | Hands-free speech-to-draft transcription with live formatting | `frontend/src/components/VoiceDictation/` | Content Creators |
| **Theme Switcher** | Anti-FOUC Dark and Light mode support with local persistence | `frontend/src/store/theme.js` | All Users |
| **Human-in-the-Loop** | FSM workflow (`DRAFT` -> `IN_REVIEW` -> `APPROVED`) with gated sign-offs | `backend/app/services/workflow.py` | Legal Reviewers, Managers |
| **Guideline Insights** | Dispute rate tracking and recurring agency mistake analytics | `backend/app/services/insights.py` | Brand Operations |
| **Audit Trail** | Append-only event ledger with RFC 4180 CSV export | `backend/app/services/audit.py` | Auditors, Legal Counsel |

---

## 2. In-Depth Feature Descriptions

### 2.1 Deterministic Rule Engine
Executes locally within 5–15 milliseconds without requiring cloud LLM connectivity:
- **Prohibited Terms**: Flags banned words, deprecated products (e.g. *HyperSync*), and competitor disparagement (*cheap alternatives*).
- **Claim Patterns**: Detects superlatives (*world's best*, *#1*, *fastest*), unconditional guarantees, and unqualified percentages.
- **Readability**: Calculates Flesch Reading Ease and Flesch-Kincaid Grade Level, warning when sentences exceed 35 words.
- **Accessibility & Contrast**: Evaluates WCAG 2.1 AA luminance ratios (4.5:1 body, 3:1 large text) and detects ambiguous links (*click here*).

### 2.2 Grounded AI Review & ClaimCheck
- Uses Groq (`llama-3.3-70b-versatile`) with structured JSON mode to inspect drafts against vectorized company guidelines.
- Flags claims as **Supported** (matching active benchmarks), **Outdated** (referencing expired figures like legacy SLAs), or **Unsupported** (unsubstantiated claims).
- Cites exact database chunk IDs so reviewers know the official policy origin.

### 2.3 Predictive Compliance Scoring
Generates a multi-axis radar assessment of draft readiness before formal submission:
- **Tone Score**: Measures alignment with enterprise voice principles.
- **Accuracy Score**: Rates factual grounding against active fact sheets.
- **Legal Risk Score**: Flags potential warranty and comparative advertising exposure.
- **Accessibility Score**: Rates reading ease and visual contrast.

### 2.4 AI Auto-Rewrite Assistant
- When findings are identified, the user can click **Auto-Rewrite**.
- Groq generates a revised draft adhering to all cited guidelines while strictly preserving author intent and key marketing points.
- Users review changes in a side-by-side diff modal before accepting.

### 2.5 Multimodal Image Governance
- Analyzes uploaded marketing banners, graphics, and slide screenshots.
- OCR extracts embedded text for ClaimCheck validation.
- Image redaction blurs detected human faces, vehicle plates, and confidential screen elements.
- Visual checks evaluate dominant color palettes against brand color tokens.

### 2.6 Immutable Audit Trail & Insights
- Logs every scan, redaction event, dispute, rewrite acceptance, and approval decision.
- Exports to RFC 4180 CSV for external regulatory reviews.
- Surfaces analytics on which rules trigger the highest dispute rates, helping brand teams identify ambiguous or outdated policies.
