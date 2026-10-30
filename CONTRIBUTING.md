# Contributing to BrandGuard

Thank you for your interest in contributing to **BrandGuard**! We welcome community contributions to improve pre-publish brand governance, factual verification, and accessibility enforcement.

---

## 1. Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to the project maintainers.

---

## 2. Ways to Contribute

- **Reporting Bugs**: Open an issue using the Bug Report template detailing reproduction steps.
- **Suggesting Features**: Propose new rule checks, integrations, or UX enhancements via the Feature Request template.
- **Improving Documentation**: Fix typos, add examples, or expand architectural diagrams.
- **Submitting Code**: Implement features or fixes following our pull request guidelines.

---

## 3. Development & Pull Request Workflow

### 3.1 Branch Naming Conventions
Use descriptive branch prefixes matching your intent:
- `feat/short-description`: New feature or capability.
- `fix/short-description`: Bug fix or error resolution.
- `docs/short-description`: Documentation addition or edit.
- `perf/short-description`: Performance improvement.
- `refactor/short-description`: Code restructuring without functional change.

### 3.2 Commit Message Standards
We follow the **Conventional Commits** specification:
```
<type>(<scope>): <short description in present tense>

[optional body explaining motivation]

[optional footer referencing issue]
```

**Allowed Types**:
- `feat`: A new user-facing feature.
- `fix`: A bug fix.
- `docs`: Documentation changes only.
- `style`: Changes that do not affect code logic (formatting, whitespace).
- `refactor`: Code change that neither fixes a bug nor adds a feature.
- `perf`: Code change that improves performance.
- `test`: Adding or updating test suites.
- `chore`: Maintenance tasks, package configuration, or repository templates.

### 3.3 PR Submission Checklist
Before opening a Pull Request:
1. Ensure your branch is rebased on `main`.
2. Verify all backend test suites pass:
   ```bash
   cd backend
   python test_suite.py
   python test_multimodal_logic.py
   ```
3. Verify the frontend builds cleanly without linting errors:
   ```bash
   cd frontend
   npm run build
   ```
4. Fill out the [Pull Request Template](.github/pull_request_template.md) completely.
5. Link relevant issue tickets.
