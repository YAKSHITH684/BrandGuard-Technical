# Technical Specification: Human Approval Workflow and State Machine

## 1. Overview and Design Principles

BrandGuard operates on the foundational principle of **Human-in-the-Loop Governance**:
- AI algorithms and rule engines advise and highlight; they **never** auto-publish or silently modify live customer-facing content.
- Draft progression is governed by a deterministic **Finite State Machine (FSM)**.
- Gated sign-offs enforce separation of concerns across Content Creators, Brand Managers, and Legal Reviewers.

---

## 2. Finite State Machine (FSM) Lifecycle

```
                     +---------------------------------------+
                     |                 DRAFT                 |
                     +-------------------+-------------------+
                                         | Submit for Review (Creator)
                                         v
                     +---------------------------------------+
                     |               IN_REVIEW               |
                     +-------+-----------+-----------+-------+
                             |           |           |
            Request Changes  |           | Dispute   | Approve Standard (Manager)
            (Reviewer)       |           | (Creator) | Approve Gated (Legal)
                             v           v           v
+-----------------------------+ +------------+ +-----------------------------+
|      CHANGES_REQUESTED      | |  DISPUTED  | |          APPROVED           |
+--------------+--------------+ +-----+------+ +-----------------------------+
               | Re-submit            | Resolve Dispute
               +----------------------+
```

### 2.1 State Definitions
- **`DRAFT`**: Authoring state. The creator can freely edit text, run deterministic scans, and request AI Auto-Rewrites.
- **`IN_REVIEW`**: Draft submitted for formal evaluation. Locked against concurrent edits while queued in `/reviews`.
- **`CHANGES_REQUESTED`**: A reviewer has rejected one or more claims and supplied feedback notes. Creator must address findings before resubmission.
- **`DISPUTED`**: The creator has formally disputed a rule finding, providing a business or legal rationale. Routes directly to the Legal Review Queue.
- **`APPROVED`**: Final approved state with verified cryptographic audit signature. Content is authorized for publishing to CMS or marketing channels.

---

## 3. Role-Based Permission Matrix

State transitions are validated by `backend/app/services/workflow.py`:

```python
TRANSITION_RULES = {
    ("DRAFT", "IN_REVIEW"): ["creator", "manager", "reviewer"],
    ("IN_REVIEW", "CHANGES_REQUESTED"): ["manager", "reviewer"],
    ("IN_REVIEW", "DISPUTED"): ["creator"],
    ("IN_REVIEW", "APPROVED"): ["manager", "reviewer"],
    ("DISPUTED", "APPROVED"): ["reviewer"],  # Legal sign-off required
    ("CHANGES_REQUESTED", "IN_REVIEW"): ["creator", "manager"]
}
```

### 3.1 Legal Review Gating Rules
A draft **cannot** be approved by a standard Brand Manager and requires a Legal Reviewer (`role == "reviewer"`) if:
1. The draft status is `DISPUTED`.
2. Any finding on the draft carries a `severity` of `CRITICAL`.
3. ClaimCheck classifies any assertion as `Unsupported` or `Outdated`.

---

## 4. Version Diffing and Audit Trail Integration

- **Snapshot Generation**: Every time a draft transitions from `CHANGES_REQUESTED` or `DRAFT` to `IN_REVIEW`, a snapshot is persisted in `draft_versions` with an incremented version counter (`v1`, `v2`, `v3`).
- **Diff Inspection**: The frontend `VersionDiff/VersionDiff.jsx` component allows reviewers to inspect side-by-side additions and deletions between any two revisions.
- **Audit Signature**: Approvals write an immutable record into `approvals` and `audit_logs` storing the timestamp, reviewer ID, IP address, and review comments.
