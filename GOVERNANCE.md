# Project Governance and Decision-Making Model

## 1. Overview

BrandGuard operates under an open, meritocratic governance model designed to foster transparent collaboration while preserving strict brand safety, code quality, and security standards.

---

## 2. Roles and Responsibilities

### 2.1 Project Maintainers
- **Responsibilities**: Oversee technical direction, cut releases, manage repository security, and maintain core architectural integrity.
- **Authority**: Final approval on pull requests, npm package releases, and infrastructure deployments.
- **Current Maintainer**: `YAKSHITH684` (`yakshith023@gmail.com`).

### 2.2 Domain Reviewers
- **Responsibilities**: Review pull requests within specific functional domains:
  - *AI & RAG Reviewers*: Evaluate retrieval algorithms, prompt safety, and ClaimCheck logic.
  - *Frontend Reviewers*: Evaluate React component architecture, accessibility (WCAG), and responsive design.
  - *Compliance & Legal Reviewers*: Ensure guideline seed files and fact sheets reflect real-world enterprise standards.

### 2.3 Contributors
- **Responsibilities**: Anyone who submits issues, proposes documentation improvements, or submits pull requests adhering to [CONTRIBUTING.md](CONTRIBUTING.md).

---

## 3. Decision-Making Process

### 3.1 Lazy Consensus (Standard Changes)
For non-breaking enhancements, bug fixes, and documentation improvements, we utilize **Lazy Consensus**:
- A pull request is submitted and reviewed.
- If no objections are raised within 48 hours and all automated tests pass, the PR may be merged by a maintainer.

### 3.2 Request for Comments (RFC) Process (Major Architectural Shifts)
For proposals that introduce:
- Breaking changes to REST API contracts.
- Database schema migrations affecting pgvector or SQLite compatibility.
- New foundation LLM providers or third-party inference backends.

**RFC Procedure**:
1. Open a GitHub Discussion with the `[RFC]` prefix.
2. Outline the motivation, technical design, backward compatibility considerations, and alternatives considered.
3. Allow a 7-day community discussion period.
4. Maintainers make the final consensus determination.

---

## 4. Conflict Resolution

If a consensus cannot be reached through technical discussion, the Lead Maintainer has casting authority to make the final determination in alignment with BrandGuard's core principles: **Explainability**, **Strict Grounding**, and **Zero-Leak Privacy**.
