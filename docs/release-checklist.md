# Production Release Checklist

Maintainers must complete this checklist prior to publishing any production release of BrandGuard.

---

## Phase 1: Pre-Release Code Freeze
- [ ] Ensure all pull requests intended for this release are merged into `main`.
- [ ] Confirm no unresolved critical (`priority: critical (P0)`) issues exist.
- [ ] Run backend automated integration suites:
  ```bash
  cd backend
  python test_suite.py
  python test_multimodal_logic.py
  python e2e_test_suite.py
  ```
- [ ] Confirm zero exit code errors on all suites.
- [ ] Verify frontend build and static export:
  ```bash
  cd frontend
  npm run build
  ```
- [ ] Confirm `./out` directory is populated with static HTML, CSS, and JS assets.

---

## Phase 2: Version Bumping & Changelog
- [ ] Determine version bump level following Semantic Versioning (Major / Minor / Patch).
- [ ] Update version in `frontend/package.json`.
- [ ] Update `CHANGELOG.md` with:
  - Release version and date.
  - Added features.
  - Changed behaviors.
  - Deprecated functions.
  - Fixed bugs.

---

## Phase 3: Deployment & Tagging
- [ ] Create an annotated Git release tag:
  ```bash
  git tag -a v1.x.x -m "Release v1.x.x"
  git push origin v1.x.x
  ```
- [ ] Verify Render dashboard build triggers for:
  - `brandguard-web` (Static Site CDN)
  - `brandguard-api` (FastAPI Web Service)
- [ ] Confirm Render build logs show `Build successful`.

---

## Phase 4: Live Smoke Testing (`brandguard-technical.onrender.com`)
- [ ] Load production landing page: `https://brandguard-technical.onrender.com`.
- [ ] Test 1-click persona switch:
  - [ ] Log in as **Alex Vance** (Creator).
  - [ ] Log in as **Elena Rostova** (Brand Manager).
  - [ ] Log in as **Marcus Sterling** (Legal Reviewer).
- [ ] Submit a test draft with a known violation (e.g. "HyperSync").
- [ ] Verify the finding card appears with guideline citation.
- [ ] Test **Auto-Rewrite** modal and verify side-by-side diff.
- [ ] Test **ClaimCheck** on sample factual assertions.
- [ ] Navigate to `/audit` and download the CSV audit log export.
- [ ] Toggle Dark/Light mode to verify anti-FOUC behavior.

---

## Phase 5: Post-Release Wrap-up
- [ ] Close milestone on GitHub.
- [ ] Publish GitHub Release notes linking git tag and changelog summary.
