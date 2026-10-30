# BrandGuard Project Overview

## 1. Mission and Problem Statement

In enterprise marketing and content publishing, maintaining brand consistency, legal compliance, and factual accuracy across distributed teams is an ongoing operational challenge:
- Marketing teams accidentally publish deprecated product names (e.g., using "HyperSync" instead of "Acme LiveSync").
- Promotional content makes ungrounded claims and superlatives ("#1 platform in the world", "100% zero downtime guaranteed") that introduce severe legal and regulatory liability.
- Outdated technical metrics and expired SLAs (such as quoting an old 99.85% SLA instead of the verified 99.95% SLA) mislead prospects and clients.
- Content creators fail accessibility standards, such as non-descriptive links ("click here") or inaccessible contrast ratios.

**BrandGuard** is an explainable, pre-publish brand governance system that shifts brand compliance left. Rather than reacting after content is published, BrandGuard intercepts drafts during creation, evaluates copy and visual assets against approved guidelines and fact sheets, and provides grounded, actionable suggestions.

---

## 2. Core Value Proposition

| Dimension | Traditional Manual Review | BrandGuard Pre-Publish Governance |
|---|---|---|
| **Turnaround Time** | 2–5 business days across legal and brand | Seconds for real-time automated pre-flight analysis |
| **Grounding** | Subjective feedback based on personal memory | Strict citation of specific guideline sections and fact sheet chunks |
| **Enforcement** | Inconsistent across different reviewers | Uniform enforcement via deterministic checks and RAG models |
| **Remediation** | Vague rejection messages | Actionable, intent-preserving rewrite suggestions |
| **Accountability** | Scattered Slack messages and email threads | Immutable, exportable audit trail with role signatures |

---

## 3. Pre-Seeded User Personas

BrandGuard incorporates role-based access control (RBAC) mapped to enterprise workflows:

### 1. Alex Vance — Content Creator (`creator@brandguard.io`)
- **Role**: Content Creator
- **Primary Goals**: Submit marketing copy, social media posts, and visual drafts for instant compliance feedback.
- **Key Capabilities**:
  - Submits new drafts via web interface or voice dictation.
  - Reviews highlighted findings and understands exact guideline citations.
  - Accepts, edits, or disputes suggested auto-rewrites.
  - Re-submits revised drafts for review.

### 2. Elena Rostova — Brand Manager (`manager@brandguard.io`)
- **Role**: Brand Operations & Manager
- **Primary Goals**: Ingest and maintain living brand guidelines, terminology glossaries, and verify overall team compliance.
- **Key Capabilities**:
  - Uploads guideline documents (Markdown, PDF, DOCX) and triggers automatic vector chunking.
  - Reviews standard drafts and approves low-to-medium risk copy.
  - Inspects visual violations and recurring agency mistakes in the Insights dashboard.
  - Identifies ambiguous guidelines based on creator dispute trends.

### 3. Marcus Sterling — Legal & Compliance Reviewer (`reviewer@brandguard.io`)
- **Role**: Legal Counsel / Compliance Officer
- **Primary Goals**: Provide gated review and final sign-off for sensitive factual claims, performance assertions, and disputed findings.
- **Key Capabilities**:
  - Accesses the gated Legal Review Queue.
  - Validates ClaimCheck outputs against date-bounded fact sheets.
  - Approves or rejects disputed claims with binding legal notes.
  - Exports immutable audit logs for regulatory compliance audits.

---

## 4. Architectural Principles

1. **Explainable by Design**: Every finding must cite the exact rule name, source document, and source chunk. Black-box verdicts are strictly prohibited.
2. **Human-in-the-Loop**: The platform never silently rewrites or auto-publishes content. Creators and reviewers retain full agency to accept, modify, or reject every recommendation.
3. **Zero-Leak Privacy**: Drafts are scrubbed of PII, secrets, and credentials before external LLM inference. Images have sensitive faces and credentials blurred locally.
4. **Deterministic First**: Rules that can be executed deterministically (banned words, readability formulas, WCAG contrast) run instantly without LLM dependency.
5. **Local-First Resilience**: If cloud LLMs or vector databases are unavailable, the application gracefully degrades to local heuristic analysis and SQLite storage without crashing.
