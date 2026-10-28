import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell/AppShell";
import { api } from "../../services/api";
import { FileText, FilePlus2, Filter, ArrowRight } from "lucide-react";

export default function DraftsListPage() {
  const [drafts, setDrafts] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadDrafts = async (statusFilter) => {
    setLoading(true);
    try {
      const data = await api.getDrafts(statusFilter || undefined);
      setDrafts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrafts(filter);
  }, [filter]);

  const statusColors = {
    DRAFT: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
    IN_REVIEW: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    CHANGES_REQUESTED: "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    DISPUTED: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    APPROVED: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    REJECTED: "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800",
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-emerald-600" />
              Content Drafts
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and audit your marketing assets, whitepapers, and releases.
            </p>
          </div>

          <Link
            href="/drafts/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <FilePlus2 className="w-4 h-4" />
            New Draft Submission
          </Link>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
          <Filter className="w-4 h-4 text-slate-400 dark:text-slate-500 ml-1 mr-1" />
          {["", "DRAFT", "IN_REVIEW", "CHANGES_REQUESTED", "DISPUTED", "APPROVED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                filter === s
                  ? "bg-emerald-600 text-white font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {s ? s.replace("_", " ") : "All Drafts"}
            </button>
          ))}
        </div>

        {/* Drafts Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading drafts...</div>
          ) : drafts.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No drafts match the selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase font-semibold text-xs">
                  <tr>
                    <th className="px-5 py-3 text-left">Draft Title</th>
                    <th className="px-5 py-3 text-left">Author</th>
                    <th className="px-5 py-3 text-left">Status</th>
                    <th className="px-5 py-3 text-left">Version</th>
                    <th className="px-5 py-3 text-left">Last Updated</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {drafts.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-900 dark:text-slate-100">
                        <Link
                          href={`/drafts/${d.id}`}
                          className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {d.title}
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">{d.author_name}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            statusColors[d.status] || "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {d.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-slate-500">
                        v{d.current_version}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(d.updated_at || d.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/drafts/${d.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          Inspect Findings
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
