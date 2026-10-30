import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Clock,
  UserCheck,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  FileCheck
} from "lucide-react";

export default function PredictiveScoreCard({
  scoreData,
  loading = false,
  onRefresh,
  onOpenAutoRewrite,
  compact = false
}) {
  const [expanded, setExpanded] = useState(!compact);

  if (!scoreData && !loading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs text-center">
        <ShieldCheck className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Predictive Compliance Scoring</h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3">
          Forecast pre-publish approval turnaround, review gates, and 5-vector compliance score.
        </p>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Calculate Score
          </button>
        )}
      </div>
    );
  }

  const {
    overall_score = 100,
    grade = "A+",
    risk_level = "low",
    approval_probability = 0.95,
    estimated_turnaround_minutes = 3.5,
    gate_forecast = "direct_approval",
    required_reviewers = ["brand_manager"],
    dimensions = [],
    top_positives = [],
    top_risks = [],
    actionable_recommendations = [],
    detected_violations_count = 0
  } = scoreData || {};

  // Color schemes based on score and risk
  const getScoreTheme = (score) => {
    if (score >= 88) return { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40", border: "border-emerald-200 dark:border-emerald-800", stroke: "#10B981" };
    if (score >= 70) return { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40", border: "border-blue-200 dark:border-blue-800", stroke: "#3B82F6" };
    if (score >= 50) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40", border: "border-amber-200 dark:border-amber-800", stroke: "#F59E0B" };
    return { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40", border: "border-rose-200 dark:border-rose-800", stroke: "#EF4444" };
  };

  const theme = getScoreTheme(overall_score);

  // SVG Gauge calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overall_score / 100) * circumference;

  const gateLabels = {
    direct_approval: { label: "1-Click Direct Approval", color: "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700" },
    manager_review: { label: "Brand Manager Review Gate", color: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700" },
    legal_escalation: { label: "Legal & Privacy Escalation", color: "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-700" }
  };

  const gateInfo = gateLabels[gate_forecast] || gateLabels.manager_review;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 transition-colors">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              Predictive Compliance Scoring
              <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Pre-Publish AI Gate
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Multi-vector brand audit & approval turnaround forecast
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Recalculate predictive score"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-600" : ""}`} />
            </button>
          )}
          {compact && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Score Hero Card */}
      <div className={`p-4 rounded-xl border ${theme.bg} ${theme.border} flex flex-col sm:flex-row items-center justify-between gap-5`}>
        {/* Radial Progress Gauge */}
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-200 dark:stroke-slate-800"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={theme.stroke}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                style={{ transition: "stroke-dashoffset 0.8s ease-in-out" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-xl font-extrabold font-mono ${theme.text}`}>
                {overall_score.toFixed(0)}%
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Grade {grade}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${theme.bg} ${theme.border} ${theme.text}`}>
                {risk_level} Risk
              </span>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                {detected_violations_count === 0 ? "Zero violations" : `${detected_violations_count} issue(s) detected`}
              </span>
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
              Approval Probability: <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{Math.round(approval_probability * 100)}%</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Clock className="w-3 h-3 text-slate-400" />
              Est. Turnaround: <strong className="text-slate-700 dark:text-slate-300">{estimated_turnaround_minutes}m</strong>
            </div>
          </div>
        </div>

        {/* Gate Forecast & Quick Action */}
        <div className="flex flex-col items-end gap-2 w-full sm:w-auto text-right">
          <div className="text-[11px] text-slate-500 dark:text-slate-400">Review Gate Forecast:</div>
          <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${gateInfo.color}`}>
            {gateInfo.label}
          </span>
          <div className="text-[10px] text-slate-500 dark:text-slate-400">
            Sign-off: {required_reviewers.map(r => r.replace("_", " ")).join(" + ")}
          </div>
          {onOpenAutoRewrite && (
            <button
              type="button"
              onClick={onOpenAutoRewrite}
              className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Boost Score with AI Auto-Rewrite
            </button>
          )}
        </div>
      </div>

      {/* Expanded Details: 5 Vector Progress Bars */}
      {expanded && (
        <div className="space-y-4 pt-1">
          <div>
            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              Governance Vector Breakdown (5 Pillars)
            </h4>

            <div className="space-y-2.5">
              {dimensions.map((dim) => {
                const dimTheme = getScoreTheme(dim.score);
                return (
                  <div key={dim.category} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{dim.label}</span>
                        <span className="text-[10px] text-slate-400">({Math.round(dim.weight * 100)}% wt)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${dimTheme.text}`}>
                          {dim.score.toFixed(0)}%
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          dim.status === "pass" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                          dim.status === "warning" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                          "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}>
                          {dim.status}
                        </span>
                      </div>
                    </div>

                    {/* Vector Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${dim.score}%`,
                          backgroundColor: dimTheme.stroke
                        }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {dim.summary}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Positives & Risks Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Top Positives */}
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <h5 className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Governance Strengths ({top_positives.length})
              </h5>
              <ul className="space-y-1">
                {top_positives.map((pos, idx) => (
                  <li key={idx} className="text-[11px] text-emerald-900 dark:text-emerald-200 flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5">•</span>
                    <span>{pos}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Risks */}
            <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 space-y-2">
              <h5 className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Approval Blockers ({top_risks.length})
              </h5>
              <ul className="space-y-1">
                {top_risks.map((risk, idx) => (
                  <li key={idx} className="text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Actionable Recommendations */}
          {actionable_recommendations.length > 0 && (
            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 space-y-2">
              <h5 className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Actionable Score Boost Steps
              </h5>
              <div className="space-y-1.5">
                {actionable_recommendations.map((rec, idx) => (
                  <div key={idx} className="text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-indigo-500 font-bold">{idx + 1}.</span>
                      <span>{rec}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
