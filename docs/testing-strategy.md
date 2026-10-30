# Testing Strategy and Test Suites

## 1. Quality Assurance Strategy

BrandGuard employs a multi-tiered testing strategy designed to verify determinism, security boundaries, and workflow integrity without reliance on external cloud services:

```
+-------------------------------------------------------------------------+
|                  Full-Flow E2E & Scenario Tests                         |
|   - e2e_test_suite.py (Full application flow across all routers)        |
|   - test_user_scenarios.py (Alex Vance -> Elena -> Marcus Sterling)     |
+------------------------------------+------------------------------------+
                                     ^
                                     |
+------------------------------------+------------------------------------+
|                  Integration & Pipeline Tests                           |
|   - test_suite.py (17-step end-to-end integration test)                 |
|   - test_multimodal_logic.py (OCR, visual palette, face blurring)       |
+------------------------------------+------------------------------------+
                                     ^
                                     |
+------------------------------------+------------------------------------+
|                  Unit & Subsystem Tests                                 |
|   - test_auth_reset.py (JWT signing, bcrypt, persona switching)         |
|   - test_drafts_and_review_queue.py (Draft lifecycle & FSM transitions) |
|   - Deterministic check unit evaluations (readability, contrast, terms) |
+-------------------------------------------------------------------------+
```

---

## 2. Test Suite Breakdown

### 2.1 17-Step End-to-End Integration Test (`backend/test_suite.py`)
Executes an automated end-to-end pass verifying all core subsystems sequentially:
1. Workspace initialization and database seeding.
2. User authentication and JWT issuance across all three personas.
3. Ingestion of brand guidelines and corporate fact sheets.
4. Semantic chunking and vector embedding generation.
5. Content draft creation with deliberate compliance violations.
6. Execution of deterministic checks (banned terms, superlatives, contrast, readability).
7. Execution of vector nearest-neighbor retrieval.
8. Structured review synthesis and finding generation.
9. Grounded citation verification against source chunks.
10. ClaimCheck verification (Supported vs Outdated vs Unsupported).
11. Content creator resolution actions (Accept, Edit, Dispute).
12. Review queue dispatch and role-gated filtering.
13. Brand Manager standard draft approval.
14. Legal Reviewer gated sign-off on sensitive claims.
15. Version diff snapshot generation between draft iterations.
16. Immutable audit log recording and verification.
17. RFC 4180 CSV export validation.

### 2.2 Multimodal Logic Test (`backend/test_multimodal_logic.py`)
Tests computer vision, privacy redaction, and visual compliance logic:
- Mock and real OCR text extraction from visual banners.
- Privacy redaction verifying that face and screen coordinates receive Gaussian blur.
- WCAG contrast calculation on extracted image color palettes.
- Image ClaimCheck classifying assertions extracted from graphic screenshots.

### 2.3 User Persona Scenarios (`backend/test_user_scenarios.py`)
Validates role-based boundaries and collaboration handoffs:
- **Creator Persona**: Verifies Alex Vance can submit drafts and dispute findings, but is forbidden from approving their own draft.
- **Brand Manager Persona**: Verifies Elena Rostova can approve standard drafts and update brand sources.
- **Legal Reviewer Persona**: Verifies Marcus Sterling is required to sign off on disputed or high-risk claims.

---

## 3. Running Test Suites

Execute test suites from the `backend/` directory:

```bash
# Run the 17-step comprehensive integration suite
cd backend
python test_suite.py

# Run the multimodal OCR and image privacy test suite
python test_multimodal_logic.py

# Run the full end-to-end integration suite
python e2e_test_suite.py

# Run persona scenario simulations
python test_user_scenarios.py

# Run pytest automated test files
pytest tests/
```

---

## 4. CI/CD Pre-Commit & Pre-Merge Requirements

Before creating a pull request, verify:
- [ ] All Python test scripts pass with zero exit codes (`exit code 0`).
- [ ] No regression in deterministic check calculations.
- [ ] Frontend builds cleanly with zero static export errors:
  ```bash
  cd frontend
  npm run build
  ```
- [ ] Application source code remains decoupled from test fixtures.
