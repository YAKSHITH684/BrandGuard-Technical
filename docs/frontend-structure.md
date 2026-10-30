# Frontend Architecture and Component Structure

## 1. Overview

BrandGuard's frontend is built with **Next.js 14** using the Pages router and styled with **Tailwind CSS**. It is configured for static export (`next export` to `./out`), allowing 100% serverless delivery on Render's CDN edge network with zero cold start latency.

```
frontend/
├── src/
│   ├── components/         # Reusable presentation and interactive components
│   ├── pages/              # Route pages and layouts
│   ├── services/           # Backend API communication layer
│   ├── store/              # Client-side state management (Auth, Theme)
│   ├── styles/             # Global CSS and Tailwind definitions
│   └── utils/              # Utility helpers (speech recognition, formatting)
├── public/                 # Static assets and icons
├── next.config.js          # Next.js configuration (static export setup)
├── tailwind.config.js      # Design tokens, color palettes, dark mode config
└── package.json            # NPM dependencies and build scripts
```

---

## 2. Page Hierarchy (`src/pages/`)

| Route | Page File | Purpose & Primary Features |
|---|---|---|
| `/` | `index.js` | Landing page featuring one-click persona entrance, value proposition, and quick links. |
| `/dashboard` | `dashboard.js` | Central operational workspace: live compliance scanner, demo presets, and quick metric summaries. |
| `/drafts` | `drafts/index.js` | Draft repository listing active submissions, workflow states, and compliance ratings. |
| `/drafts/new` | `drafts/new.js` | Draft authoring interface supporting raw text input, file upload, image OCR scan, and voice dictation. |
| `/drafts/[id]` | `drafts/[id].js` | Detailed draft inspection page displaying text highlights, finding cards, version diffs, and approval triggers. |
| `/reviews` | `reviews.js` | Role-gated review queue allowing Brand Managers and Legal Reviewers to approve, reject, or request changes. |
| `/insights` | `insights.js` | Visual analytics dashboard surfacing disputed rules, recurring agency errors, and visual compliance trends. |
| `/audit` | `audit.js` | Immutable event log viewer with search, filtering, and RFC 4180 CSV export capability. |
| `/sources` | `sources.js` | Knowledge base ingestion console for uploading guidelines, fact sheets, and viewing parsed vector chunks. |
| `/voice` | `voice.js` | Dedicated voice dictation studio converting audio input into real-time compliant copy. |
| `/settings` | `settings.js` | System preferences, confidence threshold sliders, and workspace configuration. |
| `/login` & `/register` | `login.js`, `register.js` | Traditional email/password credential authentication flows. |

---

## 3. Component Architecture (`src/components/`)

### 3.1 Layout and Navigation
- **`AppShell/AppShell.jsx`**: The foundational responsive frame wrapping all authenticated pages. Provides the top navigation bar, sidebar navigation links, one-click persona switcher, user profile indicator, and dark/light theme toggle.
- **`ThemeToggle/ThemeToggle.jsx`**: Manages user theme preferences (light, dark, system). Incorporates anti-FOUC (Flash of Unstyled Content) initialization scripts in `_document.js` to prevent flicker on initial page load.

### 3.2 Draft & Finding Inspection
- **`DraftViewer/DraftViewer.jsx`**: Renders draft content with synchronized visual highlights for flagged text spans. Hovering or clicking a highlighted segment scrolls the corresponding finding card into focus.
- **`FindingCard/FindingCard.jsx`**: Interactive card representing an individual compliance issue. Displays:
  - Rule name and category badge (e.g., *Banned Term*, *Superlative*, *Readability*).
  - Severity indicator (*High*, *Medium*, *Low*).
  - Grounding citation referencing the source document and chunk ID.
  - Action buttons: **Accept Rewrite**, **Edit Manually**, or **Dispute Finding**.
- **`ClaimBadge/ClaimBadge.jsx`**: Renders contextual status badges for ClaimCheck findings:
  - `Supported` (Green): Verified against current fact-sheet chunks.
  - `Outdated` (Amber): Verified against legacy or expired benchmarks.
  - `Unsupported` (Red): Unverified or ungrounded assertions.

### 3.3 Advanced Assistants
- **`AutoRewriteModal/AutoRewriteModal.jsx`**: Full-screen modal presenting an AI-generated, intent-preserving rewrite of the draft. Features side-by-side color-coded character diffs and one-click application to create a new draft version.
- **`PredictiveScoreCard/PredictiveScoreCard.jsx`**: Pre-computes and displays dynamic compliance score dials:
  - **Tone Score**: Conversational clarity and corporate voice adherence.
  - **Accuracy Score**: Grounding against verified enterprise fact sheets.
  - **Legal Risk Score**: Exposure to ungrounded claims and warranty guarantees.
  - **Accessibility Score**: Color contrast ratios and link clarity.
- **`MultimodalGovernanceSection/MultimodalGovernanceSection.jsx`**: Renders visual audit tools for uploaded marketing assets:
  - OCR claim extraction output.
  - Privacy-redacted image preview (blurred faces and sensitive credentials).
  - Color palette extraction and WCAG contrast check indicators.
- **`GroqChatBot/GroqChatBot.jsx`**: Slide-over conversational assistant enabling users to ask natural language questions regarding company brand rules.
- **`VoiceDictation/VoiceDictation.jsx`**: Integrates the Web Speech API to provide hands-free voice-to-text drafting with live punctuation formatting.

---

## 4. State Management and Services

- **`store/auth.js`**: React state and localStorage wrapper tracking user tokens, workspace identity, and current active role (`creator`, `manager`, `reviewer`).
- **`store/theme.js`**: Controls light/dark CSS class toggling on the `<html>` root element.
- **`services/api.js`**: Centralized HTTP client configuring authorization bearer headers, automatic JSON serialization, base URL routing, and error interceptors.
