# Technical Specification: Brand Compliance Policy Engine

## 1. Architecture of the Rule Engine

The **Brand Compliance Policy Engine** (`backend/app/checks/banned_terms.py`) provides fast, deterministic enforcement of brand naming guidelines, competitor disparagement rules, and trademark protections without requiring external LLM network round-trips.

```
+-------------------------------------------------------------------------+
|                              Draft Copy                                 |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Regex Tokenizer with Word Boundaries                   |
|   Constructs compiled regular expressions: \b(?i){escaped_term}\b       |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Terminology Dictionary Matcher                         |
|   Cross-references terms from glossary.json and active database sources |
+------------------------------------+------------------------------------+
                                     |
                                     v
+-------------------------------------------------------------------------+
|                  Classification & Replacement Mapping                   |
|   - Banned Terms: Severity HIGH/CRITICAL + Preferred Alternative        |
|   - Required Terms: Injects mandatory legal qualifiers                  |
|   - Preferred Terms: Encourages brand-aligned terminology               |
+-------------------------------------------------------------------------+
```

---

## 2. Word Boundary Matching & False-Positive Prevention

A common failure mode in naive keyword scanners is substring over-matching (e.g. matching "cat" inside "category"). BrandGuard prevents false positives through strict regex compilation:
- **Boundary Anchors**: Every term is wrapped with `\b` word boundary anchors:
  ```python
  pattern = re.compile(rf"\b{re.escape(term)}\b", flags=re.IGNORECASE)
  ```
- **Case Normalization**: Terms are matched case-insensitively, but suggested replacements preserve the official brand capitalization (e.g. *Acme LiveSync* rather than *acme livesync*).

---

## 3. Rule Categories and Examples

### 3.1 Deprecated Product Names
- **Rule**: Deprecated names phased out by corporate leadership must never appear in customer communications.
- **Example**: `HyperSync` (sunset in 2024).
- **Enforcement**:
  - Severity: `CRITICAL`
  - Suggested Replacement: `Acme LiveSync`
  - Grounding: Brand Guidelines Section 2.

### 3.2 Internal Project Codenames
- **Rule**: Internal engineering codenames must not leak into public marketing.
- **Example**: `MegaCloud` (internal project name).
- **Enforcement**:
  - Severity: `HIGH`
  - Suggested Replacement: `Acme Enterprise Hub`
  - Grounding: Brand Guidelines Section 2.

### 3.3 Competitor Disparagement Policy
- **Rule**: Content must never use derogatory phrasing regarding competitors.
- **Example**: `cheap alternatives`, `inferior legacy competitors`.
- **Enforcement**:
  - Severity: `HIGH`
  - Suggested Replacement: `alternative architectures`
  - Grounding: Brand Guidelines Section 2.

### 3.4 Unconditional Warranty & Liability Claims
- **Rule**: Unconditional performance guarantees create strict legal liability.
- **Example**: `100% guaranteed`, `zero downtime guaranteed`, `unbreakable`.
- **Enforcement**:
  - Severity: `CRITICAL`
  - Suggested Replacement: `designed for high resilience`, `backed by our 99.95% uptime SLA`
  - Grounding: Claims Policy Section 3.2.
