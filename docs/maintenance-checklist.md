# Final Repository and System Maintenance Checklist

This checklist serves as the final maintenance and health verification protocol for the BrandGuard codebase.

---

## 1. Repository Hygiene & Secret Safety

- [ ] **No Secret Exposure**: Verify that no production API keys (`GROQ_API_KEY`), private tokens, or database passwords exist in source files or git history.
- [ ] **Gitignore Integrity**: Confirm that `.gitignore` correctly ignores:
  - Python artifacts: `__pycache__/`, `*.pyc`, `.pytest_cache/`, `venv/`.
  - Local database files: `brandguard.db`, `backend/brandguard.db`, `*.sqlite`.
  - Node & Next.js build artifacts: `node_modules/`, `.next/`, `out/`.
  - Environment variables: `.env`, `.env.local`.
- [ ] **No Dead Code**: Confirm that unused temporary scripts and backup files are cleaned up.

---

## 2. Documentation Integrity

- [ ] **Cross-Reference Validity**: Confirm that all markdown relative links (e.g. `[architecture.md](architecture.md)`) resolve to active documents.
- [ ] **Code Sample Accuracy**: Confirm that API endpoints, curl examples, and JSON payloads in `docs/api-examples.md` match active FastAPI route schemas.
- [ ] **Version Alignment**: Verify that `frontend/package.json`, `CHANGELOG.md`, and documentation headers reflect the active version (`v1.2.0`).

---

## 3. Automated Test Suite Execution

Run all test suites to confirm 100% passing status:

```bash
# 1. 17-Step Core Integration Test
cd backend
python test_suite.py

# 2. Multimodal Logic & Privacy Blurring
python test_multimodal_logic.py

# 3. Comprehensive End-to-End Suite
python e2e_test_suite.py

# 4. Multi-Persona Role Scenarios
python test_user_scenarios.py
```

Expected Result: All 4 test scripts must exit with code 0 (`exit code 0`).

---

## 4. Frontend Production Build Verification

Verify that the Next.js static export succeeds without errors:

```bash
cd frontend
npm run build
```

Expected Result:
- Zero syntax or compilation errors.
- The static export directory `out/` is populated with static HTML pages and CSS assets.

---

## 5. Live Production Sanity Check

- [ ] Load `https://brandguard-technical.onrender.com`.
- [ ] Verify that the landing page renders without CORS or bundle errors in browser developer tools.
- [ ] Verify that persona switches succeed instantly.
- [ ] Verify that the live backend Swagger docs load at `/docs`.
