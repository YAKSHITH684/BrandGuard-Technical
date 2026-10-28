import React, { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, ArrowRight, ShieldAlert, MessageSquare } from "lucide-react";

export default function ReviewQueue({ queue, onApprove, onRequestChanges, userRole }) {
  const [selectedDraftId, setSelectedDraftId] = useState(null);
  const [note, setNote] = useState("");
  const [actionType, setActionType] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedDraftId || !actionType) return;
    setSubmitting(true);
    try {
      if (actionType === "approve") {
        await onApprove(selectedDraftId, note);
      } else {
        await onRequestChanges(selectedDraftId, note);
      }
      setSelectedDraftId(null);
      setActionType(null);
      setNote("");
    } finally {
      setSubmitting(false);
    }
  };

  if (!queue || queue.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Review Queue is Clear!</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
          All submitted drafts have been reviewed and resolved. New drafts will appear here when submitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 text-xs uppercase font-semibold">
            <tr>
              <th className="px-5 py-3 text-left">Draft Title</th>
              <th className="px-5 py-3 text-left">Author</th>
              <th className="px-5 py-3 text-left">Version</th>
              <th className="px-5 py-3 text-left">Sensitive Claims</th>
              <th className="px-5 py-3 text-left">Findings</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
            {queue.map((item) => (
              <tr key={item.draft_id} className="hover:bg-slate-50/80 transition-colors">
                <td className="px-5 py-4 font-semibold text-slate-900">
                  <Link
                    href={`/drafts/${item.draft_id}`}
                    className="hover:text-emerald-600 transition-colors flex items-center gap-1.5"
                  >
                    {item.title}
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100" />
                  </Link>
                </td>
                <td className="px-5 py-4 text-slate-600 text-xs">{item.author_name}</td>
                <td className="px-5 py-4 text-slate-500 text-xs font-mono">v{item.current_version}</td>
                <td className="px-5 py-4">
                  {item.has_sensitive_claims ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      Legal Required ({item.unsupported_claims_count} unverified, {item.high_severity_count} high)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700">
                      Standard Review
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-xs font-medium text-slate-600">
                  {item.findings_count} finding{item.findings_count === 1 ? "" : "s"}
                </td>
                <td className="px-5 py-4 text-right space-x-2">
                  <Link
                    href={`/drafts/${item.draft_id}`}
                    className="inline-block px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    Inspect
                  </Link>
                  <button
                    onClick={() => {
                      setSelectedDraftId(item.draft_id);
                      setActionType("approve");
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDraftId(item.draft_id);
                      setActionType("request_changes");
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-medium"
                  >
                    Request Changes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Decision Modal */}
      {selectedDraftId && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {actionType === "approve" ? "Confirm Draft Approval" : "Request Revisions"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {actionType === "approve"
                ? "This approval will be permanently stamped into the immutable audit trail."
                : "Specify what changes the creator must make before this draft can be approved."}
            </p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add optional notes or compliance feedback..."
              rows={3}
              className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setSelectedDraftId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 text-xs font-semibold rounded-lg text-white ${
                  actionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {actionType === "approve" ? "Sign & Approve" : "Send Changes Requested"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
