# BrandGuard Project Roadmap

This document outlines the strategic product roadmap and engineering milestones for BrandGuard.

---

## 1. Short-Term Milestones (Q4 2026)

- [ ] **Interactive Visual Bounding Box Overlays**:
  - Render color-coded SVG bounding boxes directly over uploaded graphics, highlighting detected violations (off-palette colors, distorted logos, low contrast) by severity.
- [ ] **Granular Confidence Calibration Slider**:
  - Allow Brand Managers to dynamically adjust the confidence threshold ($\tau \in [0.50, 0.90]$) directly in the UI per channel.
- [ ] **Voice Dictation Punctuation Enhancements**:
  - Add real-time spoken command interpretation (e.g. "new paragraph", "cite benchmark", "quote") in the Voice Studio.

---

## 2. Mid-Term Milestones (Q1 2027)

- [ ] **Rule Impact Simulator**:
  - Enable brand managers to test proposed guideline updates by running simulations against the historical archive of approved and rejected drafts.
  - Produces a "Flip Rate" report: shows how many past drafts would pass or fail under the new policy before it goes live.
- [ ] **Headless CMS & Publishing Gateways**:
  - Native pre-publish validation plugins for Contentful, Strapi, Sanity, and WordPress.
  - Drafts cannot transition to `Published` state in the CMS until BrandGuard returns an `APPROVED` status.
- [ ] **CI/CD Publish-Gate CLI (`brandguard-cli`)**:
  - A lightweight CLI utility that runs inside GitHub Actions or GitLab CI to audit markdown documentation and marketing copy before pull requests merge:
    ```bash
    brandguard check ./content/blog/ --fail-on=CRITICAL
    ```

---

## 3. Long-Term Milestones (Q2–Q3 2027)

- [ ] **Multilingual Brand Governance**:
  - Expand deterministic checks and RAG retrieval to support multilingual marketing copy in Hindi, Spanish, German, and Japanese.
  - Native handling of localized product nomenclature and regional regulatory compliance.
- [ ] **Tamper-Evident Hash-Chained Audit Trail**:
  - Upgrade the audit ledger to use a cryptographically verifiable Merkle tree hash chain ($H_n = \text{SHA256}(H_{n-1} + \text{Event}_n)$), allowing third-party auditors to verify that historical audit records have not been altered.
- [ ] **Video & Audio Asset Governance**:
  - Automatic ingestion of MP4 video files, extracting audio tracks for Whisper transcription and sampling video keyframes for visual compliance.
