import React, { useState, useEffect } from "react";
import AppShell from "../components/AppShell/AppShell";
import { useAuth } from "../store/auth";
import { api, getApiBase, setApiBase } from "../services/api";
import { Settings, ShieldCheck, Cpu, User, CheckCircle2, AlertCircle, Server, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser, switchRole } = useAuth();
  const [readabilityTarget, setReadabilityTarget] = useState(60.0);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.65);
  const [workspaceName, setWorkspaceName] = useState("");
  const [userName, setUserName] = useState("");
  const [health, setHealth] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiUrl, setApiUrl] = useState("");
  const [apiTesting, setApiTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);

  useEffect(() => {
    setApiUrl(getApiBase());
    if (user) {
      setUserName(user.name || "");
      if (user.workspace) {
        setReadabilityTarget(user.workspace.readability_target || 60.0);
        setConfidenceThreshold(user.workspace.confidence_threshold || 0.65);
        setWorkspaceName(user.workspace.name || "");
      }
    }
    api.getHealth().then(setHealth).catch(console.error);
  }, [user]);

  const testAndSaveApi = async (overrideUrl) => {
    const target = overrideUrl || apiUrl;
    setApiTesting(true);
    setApiStatus(null);
    try {
      setApiBase(target);
      const h = await api.checkBackendHealth();
      setHealth(h);
      setApiStatus({ ok: true, msg: `Connected successfully (${h.service} v${h.version})` });
    } catch (err) {
      setApiStatus({ ok: false, msg: `Connection failed: ${err.message}` });
    } finally {
      setApiTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        name: userName,
        workspace_name: workspaceName,
        readability_target: parseFloat(readabilityTarget),
        confidence_threshold: parseFloat(confidenceThreshold),
      });
      await refreshUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-emerald-600" />
            Workspace & Governance Settings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure reading ease thresholds, confidence gates, active persona, and AI engine status.
          </p>
        </div>

        {saved && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Governance settings saved successfully.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Workspace Settings */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Workspace Guardrail Configuration
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Flesch Reading Ease Score (0 - 100)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="10"
                    max="100"
                    value={readabilityTarget}
                    onChange={(e) => setReadabilityTarget(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Default is 60.0 (Standard plain English). Higher requires simpler sentences.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Reliability / Confidence Gate (0.0 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0.1"
                    max="1.0"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Findings below this score degrade to <em>Cannot Verify</em> instead of guessing.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* User Persona & Role */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              User Profile & Role
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Your Display Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Claude"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="text-xs text-slate-600">
                Logged in email: <strong className="text-slate-900">{user?.email}</strong>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "creator", title: "Creator", desc: "Submit drafts & accept rewrites" },
                  { id: "brand_manager", title: "Brand Manager", desc: "Manage sources & approval" },
                  { id: "reviewer", title: "Legal Reviewer", desc: "Gate sensitive & unverified claims" },
                ].map((r) => (
                  <div
                    key={r.id}
                    onClick={() => switchRole(r.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      user?.role === r.id
                        ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="font-bold text-slate-900">{r.title}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{r.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Engine Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              AI Review Engine (Groq LLM)
            </h2>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">External Model Provider</span>
                <span className="text-slate-500">Groq API (Llama 3.3 70B Versatile)</span>
              </div>
              <div>
                {health?.groq_configured ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                    GROQ_API_KEY Configured
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                    Deterministic Only (Key Optional)
                  </span>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              When GROQ_API_KEY is omitted or rate-limited, BrandGuard runs full deterministic checks (banned terms, claim patterns, contrast, readability) and reports <code>ai_review: unavailable</code> without interruption.
            </p>
          </div>

          {/* Backend API Connection & Render Service URL */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                Backend API Connection
              </h2>
              <button
                type="button"
                onClick={() => testAndSaveApi()}
                disabled={apiTesting}
                className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg flex items-center gap-1 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${apiTesting ? "animate-spin" : ""}`} />
                Test Connection
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              If deploying the frontend on Render (or testing locally), specify the target backend API endpoint. Changes take effect immediately without rebuilding.
            </p>

            <div className="space-y-2">
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="https://brandguard-api.onrender.com/api"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />

              <div className="flex items-center justify-between flex-wrap gap-2 text-[11px]">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setApiUrl("http://localhost:8000/api");
                      testAndSaveApi("http://localhost:8000/api");
                    }}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 text-[10px] font-medium"
                  >
                    Reset to Localhost (8000)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setApiUrl("https://brandguard-api.onrender.com/api");
                      testAndSaveApi("https://brandguard-api.onrender.com/api");
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 text-[10px] font-medium"
                  >
                    Default Render URL
                  </button>
                </div>

                {apiStatus && (
                  <span
                    className={`font-semibold ${
                      apiStatus.ok ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {apiStatus.msg}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
