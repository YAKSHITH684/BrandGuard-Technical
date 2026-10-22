const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

function getHeaders(isFormData = false) {
  const headers = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("brandguard_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const isFormData = options.body instanceof FormData;
  const config = {
    ...options,
    headers: {
      ...getHeaders(isFormData),
      ...(options.headers || {}),
    },
  };

  const res = await fetch(url, config);
  if (!res.ok) {
    let errorDetail = `Request failed (${res.status})`;
    try {
      const errJson = await res.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (e) {
      // ignore
    }
    throw new Error(errorDetail);
  }
  // If response is CSV or blob
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("text/csv")) {
    return res.text();
  }
  return res.json();
}

export const api = {
  // Auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => request("/auth/me"),
  updateSettings: (data) =>
    request("/auth/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  // Health
  getHealth: () => request("/health"),

  // Sources & Guidelines
  getSources: () => request("/sources"),
  uploadSourceFile: (formData) =>
    request("/sources", {
      method: "POST",
      body: formData,
    }),
  pasteSource: (data) =>
    request("/sources/paste", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteSource: (id) =>
    request(`/sources/${id}`, {
      method: "DELETE",
    }),

  // Glossary
  getGlossary: () => request("/glossary"),
  addGlossaryTerm: (data) =>
    request("/glossary", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteGlossaryTerm: (id) =>
    request(`/glossary/${id}`, {
      method: "DELETE",
    }),

  // Drafts
  getDrafts: (status) =>
    request(`/drafts${status ? `?status=${encodeURIComponent(status)}` : ""}`),
  createDraft: (data) =>
    request("/drafts", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getDraft: (id) => request(`/drafts/${id}`),
  submitRevision: (id, data) =>
    request(`/drafts/${id}/versions`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getVersionDiff: (id, fromV, toV) =>
    request(`/drafts/${id}/diff?from=${fromV}&to=${toV}`),
  submitDraftForReview: (id) =>
    request(`/drafts/${id}/submit`, {
      method: "POST",
    }),
  getComments: (id) => request(`/drafts/${id}/comments`),
  addComment: (id, data) =>
    request(`/drafts/${id}/comments`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Findings
  acceptFinding: (id, data = {}) =>
    request(`/findings/${id}/accept`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  editFinding: (id, edited_text, reason) =>
    request(`/findings/${id}/edit`, {
      method: "POST",
      body: JSON.stringify({ edited_text, reason }),
    }),
  rejectFinding: (id, reason) =>
    request(`/findings/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  disputeFinding: (id, reason) =>
    request(`/findings/${id}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // Review Queue & Approvals
  getReviewQueue: () => request("/reviews"),
  approveDraft: (id, note) =>
    request(`/drafts/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ decision: "approved", note }),
    }),
  requestChanges: (id, note) =>
    request(`/drafts/${id}/request-changes`, {
      method: "POST",
      body: JSON.stringify({ decision: "changes_requested", note }),
    }),

  // Groq AI Chatbot
  chatWithAssistant: (message, history = []) =>
    request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, history }),
    }),

  // Standalone Checks
  checkContrast: (foreground, background, font_size = "normal") =>
    request("/checks/contrast", {
      method: "POST",
      body: JSON.stringify({ foreground, background, font_size }),
    }),
  checkReadability: (text, target_ease = 60.0) =>
    request("/checks/readability", {
      method: "POST",
      body: JSON.stringify({ text, target_ease }),
    }),

  // Insights
  getInsightsSummary: () => request("/insights/summary"),
  getOverriddenRules: () => request("/insights/overridden-rules"),

  // Audit
  getAuditLog: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit${query ? `?${query}` : ""}`);
  },
  getAuditExportUrl: () => `${API_BASE}/audit/export`,
};
