# Release Documentation and Versioning Strategy

## 1. Versioning Standard

BrandGuard adheres to **Semantic Versioning 2.0.0** (`MAJOR.MINOR.PATCH`):
- **MAJOR (`X.0.0`)**: Incompatible API breaking changes, fundamental schema migrations requiring data transformation, or major architectural overhauls.
- **MINOR (`0.X.0`)**: New backward-compatible features, new rule checks, added UI components, or non-breaking API additions.
- **PATCH (`0.0.X`)**: Backward-compatible bug fixes, performance optimizations, or documentation revisions.

---

## 2. Release Lifecycle and Procedures

```
[Feature Branch] ──▶ [PR & Review] ──▶ [Merge to main] ──▶ [Verification Suites]
                                                                   │
                                                                   ▼
[Post-Deploy Smoke Test] ◀── [Render Auto-Deploy] ◀── [Tag Release & Update Changelog]
```

### Step 1: Pre-Release Verification
Run all automated test suites to ensure zero regressions:
```bash
# 1. Backend Integration & Multimodal Suites
cd backend
python test_suite.py
python test_multimodal_logic.py
python e2e_test_suite.py

# 2. Frontend Production Export Check
cd ../frontend
npm run build
```

### Step 2: Update Version and Changelog
1. Update version metadata in `frontend/package.json` and backend configuration.
2. Document new features, improvements, and fixes in `CHANGELOG.md` under the new version header with the release date.

### Step 3: Git Tagging
Create an annotated Git tag representing the release:
```bash
git tag -a v1.2.0 -m "Release v1.2.0: Predictive Compliance Scoring and AI Auto-Rewrite"
git push origin v1.2.0
```

### Step 4: Deployment & Smoke Testing
Render detects merges or commits to `main` and automatically initiates service builds:
1. Monitor Render dashboard for build status on:
   - `brandguard-web` (Static Site)
   - `brandguard-api` (Web Service)
2. Execute a post-deployment smoke test:
   - Visit `https://brandguard-technical.onrender.com`.
   - Log in using a demo persona.
   - Run a quick scan on a sample draft.
   - Verify that findings and suggested rewrites render correctly.

---

## 3. Rollback Protocol

If a critical defect is identified post-release:
1. **Render Instant Rollback**: In the Render dashboard, navigate to the affected service -> **Deploys** -> select the previous successful build -> click **Rollback to this deploy**.
2. **Git Revert**: Revert the offending commit on branch `main` and tag a patch release (e.g. `v1.2.1`).
