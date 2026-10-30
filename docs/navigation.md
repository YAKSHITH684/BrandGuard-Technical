# BrandGuard Documentation Navigation Guide

Welcome to the BrandGuard documentation library! This guide provides curated reading paths tailored to your specific role and objective.

---

## 1. Role-Based Reading Paths

### 1.1 Path 1: Content Creators & Copywriters
*Learn how to draft compliant copy, interpret finding cards, and use AI Auto-Rewrite:*
1. [Project Overview](project-overview.md) — The mission and core philosophy of pre-publish brand governance.
2. [Feature Catalog](features.md) — Complete overview of capabilities, from live scanning to voice dictation.
3. [ClaimCheck Overview](claimcheck.md) — Understanding Supported, Outdated, and Unsupported badges.
4. [Human Approval Workflow](technical/human-approval-workflow.md) — How draft revisions, disputes, and approvals work.

### 1.2 Path 2: Brand Managers & Marketing Directors
*Learn how to manage guidelines, configure glossaries, and review team performance:*
1. [Brand Compliance Rules](technical/brand-compliance-rules.md) — How prohibited terms and naming conventions are enforced.
2. [Terminology Validation](technical/terminology-validation.md) — Managing dynamic glossaries and preferred phrases.
3. [Readability Analysis](technical/readability-analysis.md) — Understanding Flesch Reading Ease targets.
4. [Accessibility Checks](technical/accessibility-checks.md) — Contrast ratios and link clarity policies.

### 1.3 Path 3: Legal Counsel & Compliance Officers
*Audit factual grounding, regulatory protections, and data privacy:*
1. [Security Practices & Privacy Architecture](security.md) — Zero-leak PII masking and automated image blurring.
2. [ClaimCheck Technical Engine](technical/claimcheck-engine.md) — Date-bounded fact verification and legal gating.
3. [Citation & Grounding Contract](technical/citation-and-rag.md) — Why hallucinated rules are impossible.
4. [Immutable Audit Trail](technical/audit-trail.md) — Append-only ledger and RFC 4180 CSV export.

### 1.4 Path 4: Software Engineers & Contributors
*Set up the repository, run tests, and contribute features:*
1. [Developer Onboarding](developer-onboarding.md) — Day-one setup checklist and repo tour.
2. [Installation Guide](installation.md) — Prerequisites, virtual environments, and platform steps.
3. [Local Development](local-development.md) — Running servers, SQLite fallback, and hot-reload.
4. [System Architecture](architecture.md) — High-level components and dataflow.
5. [Backend Structure](backend-structure.md) & [Frontend Structure](frontend-structure.md) — Code layout.
6. [Testing Strategy](testing-strategy.md) — 17-step integration test and multimodal suites.
7. [Coding Standards](coding-standards.md) & [Contributing](CONTRIBUTING.md) — Code and PR conventions.

### 1.5 Path 5: DevOps & Cloud Infrastructure
*Deploy and maintain BrandGuard in staging and production:*
1. [Deployment Guide](deployment.md) — Render Blueprint configuration (Static Site + Web Service + Postgres).
2. [Database Schema](database.md) — PostgreSQL pgvector indexing and SQLite storage.
3. [Troubleshooting Guide](troubleshooting.md) — Cold starts, CORS, and port conflict resolutions.
4. [Maintenance Guidelines](maintenance.md) — Secret rotation, vacuuming, and log archiving.
5. [Release Checklist](release-checklist.md) — Pre-flight release verification steps.
