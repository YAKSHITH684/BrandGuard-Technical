import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Check,
  Copy,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  X,
  FileCheck,
  Layers,
  Wand2,
  Sliders,
  Scale,
  Zap,
  Briefcase,
  BookOpen,
  Scissors,
  CheckCircle2
} from "lucide-react";
import { api } from "../../services/api";

const PRESETS = [
  {
    id: "balanced",
    label: "Balanced",
    icon: Scale,
    description: "Compliant & natural; eliminates banned terms while preserving creator voice.",
    color: "indigo"
  },
  {
    id: "punchy",
    label: "Punchy Marketing",
    icon: Zap,
    description: "Dynamic active verbs, crisp hooks, and momentum; 100% policy-safe.",
    color: "amber"
  },
  {
    id: "executive",
    label: "Executive B2B",
    icon: Briefcase,
    description: "Authoritative enterprise tone; highlights SLA metrics and business value.",
    color: "blue"
  },
  {
    id: "accessible",
    label: "Plain English",
    icon: BookOpen,
    description: "WCAG Grade 6-8 readability, short sentences, effortless comprehension.",
    color: "emerald"
  },
  {
    id: "concise",
    label: "Concise Microcopy",
    icon: Scissors,
    description: "Cuts wordiness by 30-50%, eliminates fluff while retaining core message.",
    color: "purple"
  }
];

export default function AutoRewriteModal({
  isOpen,
  onClose,
  initialText = "",
  onApply,
  targetFinding = null
}) {
  const [selectedPreset, setSelectedPreset] = useState("balanced");
  const [customInstruction, setCustomInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("side_by_side"); // side_by_side | diff_fixes

  useEffect(() => {
    if (isOpen && initialText && !result) {
      handleGenerateRewrite();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateRewrite = async (presetOverride = null) => {
    const presetToUse = presetOverride || selectedPreset;
    setLoading(true);
    setError("");
    setCopied(false);

    try {
      const data = await api.autoRewriteContent({
        text: initialText,
        preset: presetToUse,
        custom_instruction: customInstruction.trim() || undefined,
        target_finding_id: targetFinding?.id || undefined
      });
      setResult(data);
    } catch (err) {
      setError(err.message || "Failed to generate AI auto-rewrite");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.rewritten_text) return;
    navigator.clipboard.writeText(result.rewritten_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    if (!result?.rewritten_text) return;
    onApply(result.rewritten_text);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden transition-all">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                AI Auto-Rewrite Assistant
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  Llama 3.3 + Deterministic Safety
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-click copy transformation, tone modulation, and predictive score boosting
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tone Presets Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Choose Tone & Style Preset
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {PRESETS.map((p) => {
                const Icon = p.icon;
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedPreset(p.id);
                      handleGenerateRewrite(p.id);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 dark:border-indigo-500 ring-2 ring-indigo-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <Icon className={`w-4 h-4 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500"}`} />
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? "text-indigo-900 dark:text-indigo-200" : "text-slate-800 dark:text-slate-200"}`}>
                        {p.label}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                        {p.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Prompt Refinement */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="Add optional custom instructions (e.g., 'Emphasize SLA uptime', 'Make CTA bolder')..."
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleGenerateRewrite();
                }
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => handleGenerateRewrite()}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 shrink-0 inline-flex items-center gap-1.5 transition-colors"
            >
              <Wand2 className="w-3.5 h-3.5" />
              {loading ? "Rewriting..." : "Update"}
            </button>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Auditing guidelines & synthesizing compliant copy...
              </p>
            </div>
          )}

          {/* Results Block */}
          {!loading && result && (
            <div className="space-y-4">
              {/* Score Boost Banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <span>Score Boost:</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 text-sm font-extrabold">
                        +{result.score_boost > 0 ? result.score_boost : 0}%
                      </span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({result.original_score.toFixed(0)}% Grade {result.original_grade} ➔ {result.projected_score.toFixed(0)}% Grade {result.projected_grade})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>Violations Resolved: <strong className="text-emerald-600 dark:text-emerald-400">{result.diff_summary?.violations_resolved || result.fixes_applied.length}</strong></span>
                      <span>·</span>
                      <span>Words: <strong>{result.diff_summary?.remained_words || result.diff_summary?.rewritten_words}</strong> ({result.diff_summary?.word_delta >= 0 ? `+${result.diff_summary?.word_delta}` : result.diff_summary?.word_delta})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-[10px] font-mono px-2 py-1 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {result.ai_status === "groq" ? `⚡ ${result.model_used}` : "🛡️ Deterministic Safety Engine"}
                  </span>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("side_by_side")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === "side_by_side"
                      ? "bg-slate-900 dark:bg-indigo-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  Side-by-Side Review
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("diff_fixes")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === "diff_fixes"
                      ? "bg-slate-900 dark:bg-indigo-600 text-white"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Policy Fixes Applied ({result.fixes_applied?.length || 0})
                </button>
              </div>

              {/* Tab 1: Side by Side View */}
              {activeTab === "side_by_side" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Original */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span>Original Draft Copy</span>
                      <span className="font-mono text-[10px] text-slate-400">{result.diff_summary?.original_words} words</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 leading-relaxed min-h-[160px] whitespace-pre-wrap">
                      {result.original_text}
                    </div>
                  </div>

                  {/* Rewritten */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      <span>AI Rewritten Copy ({result.preset})</span>
                      <span className="font-mono text-[10px] text-indigo-500">{result.diff_summary?.rewritten_words} words</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 text-xs font-mono text-indigo-950 dark:text-indigo-200 leading-relaxed min-h-[160px] whitespace-pre-wrap">
                      {result.rewritten_text}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Policy Fixes Applied */}
              {activeTab === "diff_fixes" && (
                <div className="space-y-2.5">
                  {result.fixes_applied?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                      No policy violations detected. Content is already brand-compliant!
                    </div>
                  ) : (
                    result.fixes_applied.map((fix, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300">
                              {fix.rule}
                            </span>
                            <span className="text-[11px] text-slate-600 dark:text-slate-300">
                              {fix.explanation}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-mono">
                            <span className="line-through text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                              {fix.before}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-bold">
                              {fix.after}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {result?.rewritten_text && (
              <>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy Text"}
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all hover:scale-[1.02]"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Apply Rewrite to Draft
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
