# Changelog

All notable changes to the **BrandGuard** project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.0] - 2026-10-30

### Added
- **Predictive Compliance Scoring**: Pre-computes compliance score dials across Tone, Accuracy, Legal Risk, and Accessibility prior to formal review submission.
- **AI Auto-Rewrite Assistant**: Context-aware precision copywriting engine powered by Groq, providing side-by-side character diffs and one-click revision application.
- **Multimodal Image Governance Console**: Integrates OCR text extraction, visual palette compliance, and automated privacy blurring for faces and screen credentials.
- **Voice Dictation Studio**: Hands-free voice-to-draft transcription utilizing browser-native Web Speech API.
- **Anti-FOUC Theme Switcher**: Full Dark and Light mode support with inline pre-paint theme validation script preventing visual flickering.
- **Comprehensive Documentation Catalog**: Added 30+ structured architectural, technical, API, and onboarding guides in `docs/`.
- **GitHub Repository Community Assets**: Added standardized Issue templates, Pull Request template, Security policy, Code of Conduct, Support guide, and Governance model.

### Improved
- Optimized backend startup latency with non-blocking initialization and auto-fallback SQLite detection.
- Hardened PII redaction regular expressions to catch complex bearer token formats.
- Refined WCAG 2.1 contrast formulas with precise gamma-correction linear luminance math.

---

## [1.1.0] - 2026-10-26

### Added
- **ClaimCheck Factual Verification Engine**: 3-tier classification tagging claims as Supported, Outdated, or Unsupported against date-bounded fact sheets.
- **Dual-Dialect Storage**: Native PostgreSQL `pgvector` semantic cosine indexing paired with an automatic in-memory SQLite vector fallback.
- **Groq LPU Inference**: Integrated `llama-3.3-70b-versatile` running in structured JSON mode for ultra-fast, deterministic review generation.
- **Role-Based Fast-Track Personas**: Instant 1-click authentication for Alex Vance (Creator), Elena Rostova (Brand Manager), and Marcus Sterling (Legal Reviewer).
- **Immutable Audit Trail**: Append-only event ledger tracking all scans, disputes, approvals, and redactions with RFC 4180 CSV export.

---

## [1.0.0] - 2026-10-22

### Added
- Initial project release for the **Inkloom AI Hackathon**.
- Deterministic rule engine for prohibited terminology and deprecated product naming.
- Superlative and absolute guarantee regex pattern detector.
- Flesch Reading Ease and Flesch-Kincaid Grade Level readability scoring.
- WCAG 2.1 AA color contrast calculator.
- Next.js 14 frontend and FastAPI asynchronous backend.
- Render Blueprint deployment configuration (`render.yaml`).
