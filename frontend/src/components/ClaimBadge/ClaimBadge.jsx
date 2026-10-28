import React from "react";
import { CheckCircle2, Clock, AlertTriangle, HelpCircle } from "lucide-react";

export default function ClaimBadge({ label, confidence }) {
  if (confidence === "cannot_verify") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
        Cannot Verify
      </span>
    );
  }

  if (!label) return null;

  const normalized = label.toLowerCase();

  if (normalized === "supported") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        Supported Fact
      </span>
    );
  }

  if (normalized === "outdated") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 shadow-xs">
        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        Outdated Claim
      </span>
    );
  }

  if (normalized === "unsupported") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 shadow-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
        Unsupported Claim
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
      {label}
    </span>
  );
}
