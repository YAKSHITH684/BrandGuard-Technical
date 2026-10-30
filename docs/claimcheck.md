# ClaimCheck Factual Verification Engine

## 1. Overview and Problem Context

In enterprise marketing and corporate communications, factual claims regarding system performance, customer scale, audited certifications, and uptime SLAs carry significant legal liability. Unsubstantiated claims violate advertising standards, while outdated figures mislead customers.

**ClaimCheck** is BrandGuard's dedicated factual verification engine that audits draft assertions against verified, date-bounded enterprise fact sheets. ClaimCheck operates across both written draft text and multimodal image assets (via OCR).

```
+-------------------------------------------------------------------------+
|                  Draft Content (Text or OCR Extracted)                  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                     Claim Identification Subsystem                      |
|   Extracts quantitative benchmarks, SLAs, certifications, superlatives  |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                    Fact-Sheet Knowledge Base Query                      |
|   Matches claim against chunks with effective_date and expiry_date      |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Three-Tier Verification Classification                 |
|   - Supported: Verified by active fact sheet with high confidence       |
|   - Outdated: Matches historical fact sheet that has expired            |
|   - Unsupported: No verified fact sheet record exists                   |
+-------------------------------------------------------------------------+
```

---

## 2. Three-Tier Claim Classification System

| Classification | Badge Indicator | Criteria & Real Example | Recommended Action |
|---|:---:|---|---|
| **Supported** | `Supported` (Green) | Assertion matches an active, unexpired fact sheet chunk with high confidence ($\ge 0.65$).<br>*Example*: *"Acme serves over 4,200 enterprise organizations across 45 countries."* | Approved for publication. |
| **Outdated** | `Outdated` (Amber) | Assertion matches a fact sheet benchmark that was valid historically but has expired.<br>*Example*: *"Backed by our 99.85% SLA."* (Expired in 2024; current SLA is 99.95%). | Replace with current 2025/2026 verified metric. |
| **Unsupported** | `Unsupported` (Red) | Assertion has no factual basis in the corporate fact sheet or makes an ungrounded absolute guarantee.<br>*Example*: *"100% zero downtime guaranteed under all conditions."* | Require Legal Reviewer sign-off or rewrite. |

---

## 3. Date-Bounded Fact Validation

Every chunk ingested from corporate fact sheets (`backend/app/seed/fact_sheet.md`) contains structured date boundaries:
- `effective_date`: The calendar date from which the benchmark or certification is legally active.
- `expiry_date`: The calendar date after which the benchmark must no longer be cited in promotional copy.

When ClaimCheck evaluates an assertion, it compares the current evaluation timestamp against the chunk's validity window:
- If current date $\ge$ `effective_date` AND current date $\le$ `expiry_date`: **Active (Supported)**.
- If current date > `expiry_date`: **Deprecated (Outdated)**.

---

## 4. Confidence Scoring and Thresholds

ClaimCheck computes an objective confidence metric based on semantic vector distance and entity matching:
$$\text{Confidence} = 0.7 \times \text{SemanticSimilarity} + 0.3 \times \text{EntityMatchScore}$$

- **Threshold (`CONFIDENCE_THRESHOLD = 0.65`)**: Claims scoring below 0.65 are classified as `Unsupported` rather than generating false positives.
- If an assertion is deemed `Unsupported` or `Outdated`, ClaimCheck generates an intent-preserving rewrite citing the approved fact-sheet chunk.

---

## 5. Multimodal Image ClaimCheck Integration

Marketing copy frequently appears embedded within graphics, social media banners, slide decks, and infographics:
1. The user uploads an image asset in the Drafts studio.
2. The OCR engine (`app/ai/ocr.py`) extracts text segments, bounding coordinates, and confidence ratings.
3. The extracted text is piped into the ClaimCheck verification pipeline.
4. The frontend renders unified finding cards and claim badges directly alongside the original image preview.
