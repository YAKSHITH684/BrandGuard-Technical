import React from "react";
import {
  BarChart3,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  HelpCircle,
  ShieldAlert,
  ArrowUpRight
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
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-emerald-900">
                {claim_distribution?.supported || 0}
              </div>
              <div className="text-[11px] font-semibold text-emerald-700">Supported</div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-center">
              <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-amber-900">
                {claim_distribution?.outdated || 0}
              </div>
              <div className="text-[11px] font-semibold text-amber-700">Outdated / Expired</div>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-center">
              <AlertTriangle className="w-5 h-5 text-rose-600 mx-auto mb-1" />
              <div className="text-lg font-bold text-rose-900">
                {claim_distribution?.unsupported || 0}
              </div>
              <div className="text-[11px] font-semibold text-rose-700">Unsupported</div>
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
