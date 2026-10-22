import React from "react";
import { CheckCircle2, Clock, AlertTriangle, HelpCircle } from "lucide-react";

export default function ClaimBadge({ label, confidence }) {
  if (confidence === "cannot_verify") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-300">
        <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
        Cannot Verify
      </span>
    );
  }

  if (!label) return null;

  const normalized = label.toLowerCase();

  if (normalized === "supported") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Supported Fact
      </span>
    );
  }

  if (normalized === "outdated") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shadow-xs">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Outdated Claim
      </span>
    );
  }

  if (normalized === "unsupported") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-xs">
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
        Unsupported Claim
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      {label}
    </span>
  );
}
