import React from "react";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  HelpCircle,
  ShieldAlert,
  ArrowUpRight,
  Palette,
  Image as ImageIcon,
  Layers,
  Sparkles
} from "lucide-react";

export default function InsightsCharts({ summary }) {
  if (!summary) return null;

  const {
    total_drafts,
    total_findings,
    acceptance_rate,
    average_review_time_minutes,
    violations_by_category,
    top_rules,
    claim_distribution,
    most_overridden_rules,
    issues_caught_vs_baseline
  } = summary;

  // Max count for scaling bars
  const maxCategoryCount = Math.max(...(violations_by_category?.map((c) => c.count) || [1]), 1);

  return (
    <div className="space-y-6">
      {/* Metric Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Total Drafts Reviewed
          </div>
          <div className="text-2xl font-bold text-slate-900">{total_drafts}</div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-0.5 mt-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Active governance pipeline
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Total Pre-Publish Flags
          </div>
          <div className="text-2xl font-bold text-slate-900">{total_findings}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {violations_by_category?.length || 0} policy domains
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Rewrite Acceptance Rate
          </div>
          <div className="text-2xl font-bold text-emerald-600">{acceptance_rate}%</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Suggestions adopted by creators
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
            Avg Review Turnaround
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {average_review_time_minutes} min
          </div>
          <div className="text-[11px] text-emerald-600 flex items-center gap-0.5 mt-1">
            <Clock className="w-3.5 h-3.5" />
            vs. 3.5 hrs manual baseline
          </div>
        </div>
      </div>

      {/* Two-Column: Category Breakdown & Claim Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Violations by Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-600" />
            Violations by Policy Category
          </h3>
          <div className="space-y-3">
            {violations_by_category?.map((item) => {
              const pct = Math.round((item.count / maxCategoryCount) * 100);
              return (
                <div key={item.category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700 capitalize">
                      {item.category}
                    </span>
                    <span className="text-slate-500 font-medium">
                      {item.count} flag{item.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ClaimCheck Freshness Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600" />
            ClaimCheck Factual Grounding Distribution
          </h3>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-100 dark:border-emerald-800/40 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-emerald-900 dark:text-emerald-200">
                {claim_distribution?.supported || 0}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Supported</div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-100 dark:border-amber-800/40 text-center">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-amber-900 dark:text-amber-200">
                {claim_distribution?.outdated || 0}
              </div>
              <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Outdated / Expired</div>
            </div>

            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-100 dark:border-rose-800/40 text-center">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-rose-900 dark:text-rose-200">
                {claim_distribution?.unsupported || 0}
              </div>
              <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">Unsupported</div>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
            <strong>Factual Claim Integrity:</strong>{" "}
            {claim_distribution?.total_claims > 0
              ? `${Math.round(
                  ((claim_distribution?.supported || 0) / claim_distribution.total_claims) * 100
                )}% of published claims are backed by approved source documentation.`
              : "Awaiting claimcheck evaluations on submitted drafts."}
          </div>
        </div>
      </div>

      {/* Improvement 2: Visual Violations & Image Findings Dashboard */}
      {summary.visual_insights && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Palette className="w-4 h-4 text-purple-600" />
                Visual Brand Violations & Image Governance (Improvement 2)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Aggregates image findings across all reviewed drafts: off-palette colors, wrong or distorted logos, low contrast, and missing alt text.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Visual Compliance</span>
                <span className="text-lg font-bold text-emerald-600">{summary.visual_insights.visual_compliance_score}%</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Visual Flags</span>
                <span className="text-lg font-bold text-slate-900">{summary.visual_insights.total_visual_violations}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-1">
            {/* Left Column: Visual Violations Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                Violations Breakdown by Visual Check
              </h4>
              <div className="space-y-2.5">
                {summary.visual_insights.breakdown?.map((b, bi) => (
                  <div key={bi} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-900">{b.violation_type}</span>
                      <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-purple-100 text-purple-800">
                        {b.count} flag{b.count === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 italic truncate" title={b.rule_sample}>
                      {b.rule_sample}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Recurring Agency Mistakes & Brand Manager Action Tracker */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                Recurring Agency Mistakes & Governance Actions
              </h4>
              <div className="space-y-2.5">
                {summary.visual_insights.recurring_mistakes?.map((rm, rmi) => (
                  <div key={rmi} className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{rm.agency_or_asset}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                        {rm.frequency} Recurring Flags
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-700">
                      <strong>Pattern:</strong> {rm.violation_type}
                    </div>
                    <div className="p-2 bg-white rounded-lg border border-indigo-200/60 text-[11px] text-indigo-950 flex items-center gap-1.5 shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <div>
                        <span className="font-bold text-[10px] uppercase text-indigo-800 block">Recommended Action:</span>
                        <span>{rm.recommendation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Most-Overridden Rules: Guideline Feedback Loop */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              Most-Overridden Rules (Guideline Feedback Loop)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rules with high dispute and rejection rates pinpoint ambiguous guidelines that need clarification.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-4 py-2.5 text-left">Guideline Rule</th>
                <th className="px-4 py-2.5 text-left">Category</th>
                <th className="px-4 py-2.5 text-left">Override Rate</th>
                <th className="px-4 py-2.5 text-left">Disputes / Rejections</th>
                <th className="px-4 py-2.5 text-left">Guideline Status</th>
                <th className="px-4 py-2.5 text-left">Creator Feedback / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {most_overridden_rules?.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.rule}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{item.category}</td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800">{item.override_rate}%</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {item.dispute_count} disputes, {item.reject_count} rejections
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        item.guideline_status === "Needs Clarification"
                          ? "bg-rose-100 text-rose-800"
                          : item.guideline_status === "Moderate Overrides"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {item.guideline_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 italic max-w-xs truncate" title={item.sample_reasons?.join(" | ")}>
                    {item.sample_reasons && item.sample_reasons.length > 0
                      ? `"${item.sample_reasons[0]}"`
                      : "No written dispute comments yet"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Success Metrics vs Manual Baseline */}
      {issues_caught_vs_baseline && (
        <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white p-6 rounded-2xl shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                Hackathon Impact Benchmarks
              </span>
              <h3 className="text-lg font-bold mt-1">
                Automated Governance vs. Manual Brand Review Baseline
              </h3>
              <p className="text-emerald-200/80 text-xs mt-1 max-w-xl">
                BrandGuard replaces error-prone human editorial triage with deterministic guardrails and explainable AI citations.
              </p>
            </div>
            <div className="flex gap-6 shrink-0">
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">
                  {issues_caught_vs_baseline.automated_catch_rate}
                </div>
                <div className="text-[11px] text-emerald-200">Issue Catch Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-white">
                  {issues_caught_vs_baseline.hours_saved}h
                </div>
                <div className="text-[11px] text-emerald-200">Editorial Hours Saved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-emerald-400">
                  {issues_caught_vs_baseline.median_turnaround_seconds}s
                </div>
                <div className="text-[11px] text-emerald-200">Audit Latency</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
