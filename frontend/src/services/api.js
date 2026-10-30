const RENDER_API_URL = "https://brandguard-technical1.onrender.com/api";
const LOCAL_API_URL = "http://localhost:8000/api";

export function isLocalEnvironment() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host.startsWith("192.168.");
}

export function getApiBase() {
  let base = "";
  if (typeof window !== "undefined") {
    let custom = localStorage.getItem("brandguard_api_url");
    // Auto-migrate legacy/defunct brandguard-api domain to the live brandguard-technical1 backend
    if (custom && custom.includes("brandguard-api.onrender.com")) {
      custom = custom.replace("brandguard-api.onrender.com", "brandguard-technical1.onrender.com");
      localStorage.setItem("brandguard_api_url", custom);
    }
    if (custom && custom.trim()) {
      base = custom.trim().replace(/\/+$/, "");
    } else {
      // Default local dev to localhost:8000, and deployed cloud sites to Render
      base = isLocalEnvironment() ? LOCAL_API_URL : RENDER_API_URL;
    }
  }
  if (!base) {
    base = (process.env.NEXT_PUBLIC_API_URL || (isLocalEnvironment() ? LOCAL_API_URL : RENDER_API_URL)).trim().replace(/\/+$/, "");
  }
  if (!base.endsWith("/api")) {
    base = `${base}/api`;
  }
  return base;
}

export function setApiBase(url) {
  if (typeof window !== "undefined") {
    if (url && url.trim()) {
      localStorage.setItem("brandguard_api_url", url.trim().replace(/\/+$/, ""));
    } else {
      localStorage.removeItem("brandguard_api_url");
    }
  }
}

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
  const base = getApiBase();
  const url = `${base}${endpoint}`;
  const isFormData = options.body instanceof FormData;

  // 20-second bounded timeout to prevent eternal browser hangs
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 20000);

  const config = {
    ...options,
    signal: options.signal || controller.signal,
    headers: {
      ...getHeaders(isFormData),
      ...(options.headers || {}),
    },
  };

  try {
    const res = await fetch(url, config);
    clearTimeout(timeoutId);

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
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Request timed out reaching backend at ${base}. Server may be starting up.`);
    }
    if (err.name === "TypeError" && err.message.toLowerCase().includes("fetch")) {
      throw new Error(`Cannot reach backend at ${base}. Please verify your backend server is running.`);
    }
    throw err;
  }
}

// Helper to probe an endpoint with a short timeout
async function probeHealth(baseUrl, timeoutMs = 2500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const cleanBase = baseUrl.trim().replace(/\/+$/, "");
  const targetUrl = cleanBase.endsWith("/api") ? `${cleanBase}/health` : `${cleanBase}/api/health`;

  try {
    const t0 = performance.now();
    const res = await fetch(targetUrl, {
      method: "GET",
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`Health returned HTTP ${res.status}`);
    const data = await res.json();
    const pingMs = Math.round(performance.now() - t0);
    return { ok: true, data, baseUrl: cleanBase, pingMs };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: err, baseUrl: cleanBase };
  }
}

// Background keep-alive interval to prevent Render free container sleep
let keepAliveTimer = null;
function startKeepAlive() {
  if (typeof window === "undefined" || keepAliveTimer) return;
  // Ping every 9 minutes (Render sleeps after 15 mins of inactivity)
  keepAliveTimer = setInterval(() => {
    const base = getApiBase();
    if (base.includes("onrender.com")) {
      fetch(`${base}/health`, { method: "GET", mode: "no-cors" }).catch(() => {});
    }
  }, 9 * 60 * 1000);
}
startKeepAlive();

export const api = {
  getApiBase,
  setApiBase,
  isLocalEnvironment,
  RENDER_API_URL,
  LOCAL_API_URL,

  /**
   * Fast intelligent health check:
   * 1. Probes the configured base URL with a fast timeout (2.5s)
   * 2. If it fails and in local environment, seamlessly falls back between Localhost and Cloud
   */
  checkBackendHealth: async (timeoutMs = 2800) => {
    const currentBase = getApiBase();

    // 1. Try current configured backend first
    const primary = await probeHealth(currentBase, timeoutMs);
    if (primary.ok) {
      return {
        ...primary.data,
        active_url: primary.baseUrl,
        ping_ms: primary.pingMs,
        is_local: primary.baseUrl.includes("localhost") || primary.baseUrl.includes("127.0.0.1"),
      };
    }

    // 2. If current fails in local dev environment, try alternative
    if (isLocalEnvironment()) {
      const isCurrentLocal = currentBase.includes("localhost") || currentBase.includes("127.0.0.1");
      const fallbackUrl = isCurrentLocal ? RENDER_API_URL : LOCAL_API_URL;

      const secondary = await probeHealth(fallbackUrl, 2500);
      if (secondary.ok) {
        setApiBase(secondary.baseUrl);
        return {
          ...secondary.data,
          active_url: secondary.baseUrl,
          ping_ms: secondary.pingMs,
          is_local: secondary.baseUrl.includes("localhost") || secondary.baseUrl.includes("127.0.0.1"),
          switched_to_fallback: true,
        };
      }
    }

    throw new Error(`Cannot reach backend at ${currentBase}`);
  },

  /**
   * Concurrently probes localhost and cloud in parallel, locking onto whichever is faster!
   */
  autoDetectFastestBackend: async () => {
    const candidates = [LOCAL_API_URL, RENDER_API_URL];
    const results = await Promise.all(candidates.map((url) => probeHealth(url, 2500)));
    const successful = results.filter((r) => r.ok);

    if (successful.length > 0) {
      // Pick local if available, else fastest ping
      const local = successful.find((r) => r.baseUrl.includes("localhost"));
      const winner = local || successful.sort((a, b) => a.pingMs - b.pingMs)[0];
      setApiBase(winner.baseUrl);
      return {
        ...winner.data,
        active_url: winner.baseUrl,
        ping_ms: winner.pingMs,
        is_local: winner.baseUrl.includes("localhost") || winner.baseUrl.includes("127.0.0.1"),
      };
    }

    throw new Error("Neither local backend nor cloud backend responded.");
  },

  // Auth
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  resetPassword: (email, new_password) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ email, new_password }),
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

  // Voice Agent & Audio Translation
  voiceAgentChat: (data) =>
    request("/voice/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  translateAudioFile: (formData) =>
    request("/voice/translate-audio", {
      method: "POST",
      body: formData,
    }),
  translateText: (data) =>
    request("/voice/translate-text", {
      method: "POST",
      body: JSON.stringify(data),
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
  checkMultimodal: (data) =>
    request("/checks/multimodal", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Insights
  getInsightsSummary: () => request("/insights/summary"),
  getOverriddenRules: () => request("/insights/overridden-rules"),

  // Audit
  getAuditLog: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/audit${query ? `?${query}` : ""}`);
  },
  getAuditExportUrl: () => `${getApiBase()}/audit/export`,
};
