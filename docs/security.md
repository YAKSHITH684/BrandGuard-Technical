# Security Practices and Privacy Architecture

## 1. Zero-Leak Privacy Architecture

Enterprise content drafts often contain pre-release product names, internal credentials, unannounced benchmarks, or inadvertent personally identifiable information (PII). BrandGuard enforces a strict **Zero-Leak Privacy Boundary** prior to invoking any external cloud service or large language model.

```
[Raw User Content] ──▶ [Pre-Flight Redaction Filter] ──▶ [Sanitized Text] ──▶ [External LLM API]
                               │                                                       │
                               ▼                                                       ▼
                      [Audit Log (Redacted)]                               [Grounded Review JSON]
```

### 1.1 Text Redaction Engine (`backend/app/ai/redaction.py`)
Before any draft text is submitted to Groq or embedded into vectors, regex filters scan and tokenize sensitive patterns:
- **API Keys & Credentials**: Matches patterns for Groq keys, AWS Access Key IDs, Google API keys, GitHub tokens, and generic bearer tokens (`Bearer [a-zA-Z0-9_\-\.]+`).
- **Personal Information**: Matches standard RFC email addresses, international phone numbers, and government identification numbers.
- **Replacement Strategy**: Replaced in-place with standardized non-reconstructible placeholders: `[REDACTED_API_KEY]`, `[REDACTED_EMAIL]`, `[REDACTED_PHONE]`.
- **Audit Logging**: The occurrence and type of redaction is written to the audit log without storing the secret payload itself.

### 1.2 Image Privacy Redaction (`backend/app/ai/image_redaction.py`)
For image drafts and visual assets:
- **Facial Redaction**: Automated bounding box detection applying irreversible Gaussian blur across facial regions.
- **License Plates & PII**: Blurs vehicle plates and visible hardware serial numbers.
- **Screen & Credential Blurring**: Detects console terminal windows, code IDEs, or credential screens embedded in screenshots and obfuscates the region prior to display or storage.

---

## 2. Authentication, Authorization & RBAC

### 2.1 Password Security & JWT
- **Bcrypt Hashing**: User passwords are encrypted using `passlib` with `bcrypt` salt rounds, protecting against dictionary and rainbow-table attacks.
- **Stateless JWT**: Authentication uses JSON Web Tokens signed with HMAC-SHA256 (`HS256`).
- **Token Expiration**: Access tokens are configured with explicit TTL expiration windows.

### 2.2 Role-Based Access Control (RBAC) Matrix

| Action / Resource | Creator | Brand Manager | Legal Reviewer |
|---|:---:|:---:|:---:|
| **Submit New Draft** | Yes | Yes | Yes |
| **View Own Draft Findings** | Yes | Yes | Yes |
| **Accept / Dispute AI Rewrites** | Yes | Yes | Yes |
| **Ingest Guidelines & Fact Sheets** | Read Only | Yes | Yes |
| **Approve Standard Drafts** | No | Yes | Yes |
| **Gated Sign-Off on Sensitive Claims**| No | No | Yes |
| **Export Audit Logs (CSV)** | No | Yes | Yes |
| **Configure Workspace Settings** | No | Yes | Yes |

---

## 3. Application Security & Defense-in-Depth

1. **SQL Injection Defense**: All database transactions execute through SQLAlchemy parameterized queries, preventing SQL injection vulnerabilities.
2. **Cross-Site Scripting (XSS) Prevention**: Next.js and React inherently sanitize dynamic variables rendered into the DOM, neutralizing stored and reflected script injection.
3. **CORS Security**: Cross-Origin Resource Sharing is strictly bound to explicitly declared domains (`FRONTEND_URL`) without wildcard `*` allowances in production.
4. **AI Transparency & EU AI Act Compliance**: Every automated finding includes an `ai_generated: true` metadata flag and cites the exact deterministic or RAG grounding reference.
5. **Append-Only Audit Trail**: Audit events are insert-only records with no update or deletion endpoints exposed in the API.
