import React, { useState, useEffect } from "react";
import AppShell from "../components/AppShell/AppShell";
import { useAuth } from "../store/auth";
import { api, getApiBase, setApiBase } from "../services/api";
import {
  Settings,
  ShieldCheck,
  Cpu,
  User,
  CheckCircle2,
  AlertCircle,
  Server,
  RefreshCw,
  Volume2,
  Mic,
  Lock,
  Eye,
  EyeOff,
  Key
} from "lucide-react";
import {
  speakText,
  stopSpeech,
  getDictationOptIn,
  setDictationOptIn,
  isSpeechSynthesisSupported
} from "../utils/speech";

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
  const [groqApiKey, setGroqApiKey] = useState("");
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [dictationOptIn, setDictationOptInState] = useState(false);
  const [testingSpeech, setTestingSpeech] = useState(false);

  useEffect(() => {
    setApiUrl(getApiBase());
    setDictationOptInState(getDictationOptIn());
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
        groq_api_key: groqApiKey.trim() ? groqApiKey.trim() : undefined,
      });
      setDictationOptIn(dictationOptIn);
      const h = await api.getHealth();
      setHealth(h);
      setGroqApiKey("");
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

          {/* AI Engine Status & Groq Key Configuration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-600" />
              AI Review Engine & BrandGuard Copilot (Groq Llama 3.3)
            </h2>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="font-semibold text-slate-800 block">External Model Provider</span>
                <span className="text-slate-500">Groq API (Llama 3.3 70B Versatile)</span>
              </div>
              <div>
                {health?.groq_configured ? (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    GROQ_API_KEY Configured {health.groq_key_preview ? `(${health.groq_key_preview})` : ""}
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                    Deterministic Only (Key Optional)
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Groq API Key (<code>GROQ_API_KEY</code>)
              </label>
              <div className="relative">
                <input
                  type={showGroqKey ? "text" : "password"}
                  value={groqApiKey}
                  onChange={(e) => setGroqApiKey(e.target.value)}
                  placeholder={
                    health?.groq_configured
                      ? `Key active (${health.groq_key_preview || "configured"}). Enter new key to update.`
                      : "Paste key here (e.g. gsk_...)"
                  }
                  className="w-full text-xs font-mono p-2.5 pr-20 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-2 top-2 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded font-medium"
                >
                  {showGroqKey ? "Hide" : "Show"}
                </button>
              </div>
              <p className="text-[11px] text-slate-500">
                Unlocks generative Llama 3.3 suggestions and the BrandGuard AI Copilot. When omitted, BrandGuard runs full deterministic checks with zero disruption. Click <strong>Save Settings</strong> below to apply.
              </p>
            </div>
          </div>

          {/* Voice & Accessibility Governance (Web Speech API) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-emerald-600" />
                Voice Accessibility & Zero-Exposure Privacy (Web Speech API)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Native browser Web Speech capabilities: zero external audio dependencies, zero backend changes, zero API keys.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feature 1: TTS Readout */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Volume2 className="w-4 h-4 text-emerald-600" />
                      Read Findings Aloud (TTS)
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      100% Local (Zero Exposure)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Reads findings, violations, and citations aloud directly from finding cards or the walkthrough console. Speech synthesis runs completely on your device with no network transmission.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (testingSpeech) {
                        stopSpeech();
                        setTestingSpeech(false);
                      } else {
                        setTestingSpeech(true);
                        speakText(
                          "BrandGuard voice accessibility is active. All finding readouts execute locally in your browser with zero exposure.",
                          {
                            onEnd: () => setTestingSpeech(false),
                            onError: () => setTestingSpeech(false),
                          }
                        );
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition ${
                      testingSpeech
                        ? "bg-emerald-600 text-white animate-pulse"
                        : "bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-300"
                    }`}
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {testingSpeech ? "Playing Local Audio..." : "Test Finding Readout"}
                  </button>
                </div>
              </div>

              {/* Feature 2: Dictation STT */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Mic className="w-4 h-4 text-indigo-600" />
                      Draft Voice Dictation (STT)
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        dictationOptIn
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {dictationOptIn ? "Opted In" : "Opted Out"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Browser-based speech-to-text for drafting marketing copy. To protect zero exposure, dictation is strictly opt-in and permanently disabled on image assets, OCR, and redacted content.
                  </p>
                </div>
                <div className="pt-2 flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-700 flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dictationOptIn}
                      onChange={(e) => {
                        setDictationOptInState(e.target.checked);
                        setDictationOptIn(e.target.checked);
                      }}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    Enable Voice Dictation for Drafts
                  </label>
                  <span className="text-[10px] text-slate-400">
                    (Requires mic permission)
                  </span>
                </div>
              </div>
            </div>
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
                placeholder="https://brandguard-technical1.onrender.com/api"
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
                      setApiUrl("https://brandguard-technical1.onrender.com/api");
                      testAndSaveApi("https://brandguard-technical1.onrender.com/api");
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
