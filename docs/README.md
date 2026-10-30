# BrandGuard Documentation Catalog

Welcome to the comprehensive documentation index for **BrandGuard** — Explainable Pre-Publish Brand Governance.

---

## 📚 Master Table of Contents

```
docs/
├── README.md                           # Master Documentation Catalog (This file)
├── navigation.md                       # Role-Based Reading Paths & Cross-References
├── project-overview.md                 # Mission, Personas, and Core Principles
├── features.md                         # Complete Feature Breakdown and Matrix
├── architecture.md                     # High-Level Architecture and Data Flow
├── backend-structure.md                # FastAPI Routers, Services, and Engine Layout
├── frontend-structure.md               # Next.js Pages, Components, and State Store Layout
├── database.md                         # PostgreSQL pgvector & SQLite Dual-Dialect Storage
├── api-usage.md                        # REST API Reference and Endpoint Guide
├── api-examples.md                     # Production-Ready curl and JSON Examples
├── installation.md                     # Platform Installation and Prerequisites
├── local-development.md                # Fast Start, Hot Reload, and Local Dev Workflow
├── deployment.md                       # Render Multi-Service Cloud Hosting Guide
├── troubleshooting.md                  # Diagnostics, Cold Starts, and CORS Solutions
├── security.md                         # Zero-Leak Privacy, PII Masking, and RBAC Matrix
├── ai-architecture.md                  # Groq LPU Inference and Structured JSON Audits
├── rag-workflow.md                     # Section-Aware Chunking and Cosine Similarity
├── claimcheck.md                       # 3-Tier Factual Verification Overview
├── testing-strategy.md                 # 17-Step Integration and Multimodal Test Suites
├── developer-onboarding.md             # New Contributor Day-One Guide
├── coding-standards.md                 # Python PEP 8 and JavaScript/Tailwind Standards
├── release-process.md                  # Semantic Versioning and Release Protocols
├── release-checklist.md                # Pre-Flight Deployment Verification Template
├── repository-labels.md                # GitHub Issue and PR Taxonomy
├── roadmap.md                          # Strategic Engineering Milestones
├── known-limitations.md                # Technical Boundaries and Design Trade-offs
├── maintenance.md                      # Operational Upkeep, Secret Rotation, Vacuuming
├── maintenance-checklist.md             # Final Repository Hygiene and Audit Protocol
├── faq.md                              # Frequently Asked Questions
└── technical/
    ├── ai-auto-rewrite.md              # Auto-Rewrite Engine and Diff Viewer
    ├── claimcheck-engine.md            # Date-Bounded Verification and Pattern Rules
    ├── ocr-processing.md               # Visual Text Extraction and Line Reconstruction
    ├── brand-compliance-rules.md       # Banned Terms and Naming Protection
    ├── terminology-validation.md       # Dynamic Glossaries and In-Memory Regex
    ├── readability-analysis.md         # Flesch Reading Ease and FKGL Math
    ├── accessibility-checks.md         # WCAG 2.1 AA Contrast and Alt-Text Rules
    ├── citation-and-rag.md             # Grounding Contract and Chunk Verification
    ├── human-approval-workflow.md      # Multi-Role Finite State Machine (FSM)
    └── audit-trail.md                  # Append-Only Event Store and RFC 4180 Export
```

---

## 🧭 Documentation by Category

### 1. General & Architecture Guides
- [Project Overview](project-overview.md) — Problem statement, business value, and personas.
- [System Architecture](architecture.md) — End-to-end component diagrams and subsystem interactions.
- [Backend Structure](backend-structure.md) — FastAPI directory layout, routers, and services.
- [Frontend Structure](frontend-structure.md) — Next.js pages, UI components, and state management.
- [Database Persistence](database.md) — Entity-relationship schema, pgvector, and SQLite fallback.

### 2. Developer & Operations Guides
- [Installation Guide](installation.md) — Multi-platform environment setup instructions.
- [Local Development](local-development.md) — Hot reloading, SQLite initialization, and start scripts.
- [Deployment Guide](deployment.md) — Render Blueprint configuration for CDN and API services.
- [Troubleshooting Guide](troubleshooting.md) — Cold start mitigations and CORS resolution.
- [Developer Onboarding](developer-onboarding.md) — Day-one guide and core architectural principles.
- [Coding Standards](coding-standards.md) — PEP 8, Pydantic, and Tailwind conventions.
- [Testing Strategy](testing-strategy.md) — Backend test suites and verification instructions.

### 3. API & Usage Guides
- [API Usage Reference](api-usage.md) — RESTful endpoints, parameters, and status codes.
- [API Request & Response Examples](api-examples.md) — Copy-pasteable `curl` commands and JSON bodies.
- [Frequently Asked Questions (FAQ)](faq.md) — Answers to common developer and user inquiries.
- [Documentation Navigation](navigation.md) — Role-based reading paths.

### 4. Technical Deep Dives
- [AI Auto-Rewrite Engine](technical/ai-auto-rewrite.md) — Precision copywriting and diffing algorithms.
- [ClaimCheck Engine](technical/claimcheck-engine.md) — Factual verification math and temporal date bounds.
- [OCR Processing Pipeline](technical/ocr-processing.md) — Computer vision text extraction and baseline grouping.
- [Brand Compliance Rules](technical/brand-compliance-rules.md) — Word boundary regex matching.
- [Terminology Validation](technical/terminology-validation.md) — Dynamic glossary synchronization.
- [Readability Analysis](technical/readability-analysis.md) — Flesch Reading Ease and grade level formulas.
- [Accessibility & Contrast Checks](technical/accessibility-checks.md) — WCAG 2.1 AA relative luminance math.
- [Citation & Grounding Contract](technical/citation-and-rag.md) — Cryptographic chunk grounding verification.
- [Human Approval Workflow](technical/human-approval-workflow.md) — Finite State Machine and role gating.
- [Immutable Audit Trail](technical/audit-trail.md) — Append-only compliance logging and RFC 4180 CSV export.

### 5. Repository Maintenance & Governance
- [Project Roadmap](roadmap.md) — Q4 2026 to 2027 product milestones.
- [Known Limitations](known-limitations.md) — Documented constraints and design trade-offs.
- [System Maintenance](maintenance.md) — Routine database hygiene and secret rotation.
- [Maintenance Checklist](maintenance-checklist.md) — Pre-flight audit verification protocol.
- [Release Process](release-process.md) — Semantic Versioning and deployment protocols.
- [Release Checklist](release-checklist.md) — Operational release checklist.
- [Repository Labels](repository-labels.md) — GitHub issue and pull request taxonomy.
- [Governance Model](../GOVERNANCE.md) — Project decision-making and maintainer roles.
- [Contributing Guidelines](../CONTRIBUTING.md) — Pull request standards and commit conventions.
- [Security Policy](../SECURITY.md) — Vulnerability disclosure process.
- [Code of Conduct](../CODE_OF_CONDUCT.md) — Community standards and enforcement.
- [Support Guide](../SUPPORT.md) — Where to get help and ask questions.
- [Changelog](../CHANGELOG.md) — Complete release version history.
