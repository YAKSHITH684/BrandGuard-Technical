# Security Policy

The BrandGuard team takes security, data privacy, and intellectual property protection seriously. This document outlines our vulnerability disclosure policy and supported releases.

---

## 1. Supported Versions

We provide active security patches and updates for the following versions:

| Version | Supported | Notes |
|---|:---:|---|
| `v1.2.x` | Yes | Current active production release line. |
| `v1.1.x` | Yes | Critical security patches only. |
| `< 1.1.0`| No | Deprecated; please upgrade to the latest stable release. |

---

## 2. Reporting a Vulnerability

**Please do not disclose security vulnerabilities publicly through GitHub Issues or pull requests.**

If you believe you have discovered a security vulnerability in BrandGuard:
1. **Email the Maintainers**: Send a detailed disclosure to `security@brandguard.io` (or directly contact repository maintainer `yakshith023@gmail.com`).
2. **Include Technical Details**:
   - Component affected (Backend router, AI redaction engine, JWT authentication, etc.).
   - Exact steps or proof-of-concept payload required to reproduce.
   - Potential impact and threat model.

### 2.1 Coordinated Response Timeline
- **Initial Acknowledgment**: Within **24 hours** of receipt.
- **Triage and Impact Assessment**: Within **72 hours**.
- **Fix & Disclosure Target**: Critical vulnerabilities will be resolved within **7 business days**.

---

## 3. Security Best Practices for Operators

1. **Environment Secrets**: Never commit `.env` files or API credentials (`GROQ_API_KEY`, `JWT_SECRET`) to version control.
2. **JWT Secret Strength**: Always set `JWT_SECRET` to a cryptographically secure random string of at least 32 characters in production.
3. **Database Network Boundaries**: Ensure PostgreSQL instances are restricted to private network access and enforce TLS in transit.
