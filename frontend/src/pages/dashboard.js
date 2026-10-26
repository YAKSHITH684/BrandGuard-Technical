import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import AppShell from "../components/AppShell/AppShell";
import { useAuth } from "../store/auth";
import { api } from "../services/api";
import {
  FileText,
  FilePlus2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FolderGit2,
  BarChart3
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [drafts, setDrafts] = useState([]);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      async function loadData() {
        try {
          const [draftsData, queueData] = await Promise.all([
            api.getDrafts().catch(() => []),
            api.getReviewQueue().catch(() => []),
          ]);
          setDrafts(draftsData || []);
          setQueue(queueData || []);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [user, authLoading, router]);

  const statusColors = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
    IN_REVIEW: "bg-blue-100 text-blue-800 border-blue-200",
    CHANGES_REQUESTED: "bg-amber-100 text-amber-800 border-amber-200",
    DISPUTED: "bg-purple-100 text-purple-800 border-purple-200",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    REJECTED: "bg-rose-100 text-rose-800 border-rose-200",
  };

  const approvedCount = drafts.filter((d) => d.status === "APPROVED").length;
  const inReviewCount = drafts.filter((d) => d.status === "IN_REVIEW" || d.status === "DISPUTED").length;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="text-emerald-400 font-semibold text-xs uppercase tracking-wider">
              Governance Console
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">
              Welcome back, {user?.name || "Creator"}
            </h1>
            <p className="mt-2 text-slate-300 text-sm leading-relaxed">
              Every draft is validated before publishing against your workspace's approved brand guidelines, dated fact sheet, and glossary terms.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/drafts/new"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20"
              >
                <FilePlus2 className="w-4 h-4" />
                Submit New Draft for Review
              </Link>
              {user?.role !== "creator" && (
                <Link
                  href="/reviews"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs border border-slate-700 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Review Queue ({queue.length})
                </Link>
              )}
            </div>
          </div>
          <div className="absolute right-6 -bottom-6 opacity-10 pointer-events-none hidden lg:block">
            <ShieldCheck className="w-64 h-64 text-white" />
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Active Drafts
            </div>
            <div className="text-2xl font-bold text-slate-900">{drafts.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">In current workspace</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              In Review
            </div>
            <div className="text-2xl font-bold text-blue-600">{inReviewCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Awaiting manager/legal</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Approved Content
            </div>
            <div className="text-2xl font-bold text-emerald-600">{approvedCount}</div>
            <div className="text-[11px] text-slate-500 mt-1">Cleared for publication</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Pending Actions
            </div>
            <div className="text-2xl font-bold text-amber-600">{queue.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">In approval queue</div>
          </div>
        </div>

        {/* Recent Drafts List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Workspace Content Drafts</h2>
              <p className="text-xs text-slate-500">
                Track compliance status, version history, and explainable findings.
              </p>
            </div>
            <Link
              href="/drafts"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              View all drafts
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="font-medium text-slate-700">Loading workspace drafts...</span>
              <span className="text-[11px] text-slate-400">Connecting to cloud governance engine</span>
            </div>
          ) : drafts.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <FileText className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No drafts created yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Submit your first draft to receive automated pre-publish findings.
              </p>
              <Link
                href="/drafts/new"
                className="mt-4 inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
              >
                Create First Draft
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Author</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Version</th>
                    <th className="pb-3">Last Modified</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {drafts.slice(0, 5).map((draft) => (
                    <tr key={draft.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 font-semibold text-slate-900">
                        <Link
                          href={`/drafts/${draft.id}`}
                          className="hover:text-emerald-600 transition-colors"
                        >
                          {draft.title}
                        </Link>
                      </td>
                      <td className="py-3.5 text-xs text-slate-600">{draft.author_name}</td>
                      <td className="py-3.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            statusColors[draft.status] || "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {draft.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs font-mono text-slate-500">
                        v{draft.current_version}
                      </td>
                      <td className="py-3.5 text-xs text-slate-500">
                        {new Date(draft.updated_at || draft.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 text-right">
                        <Link
                          href={`/drafts/${draft.id}`}
                          className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:underline"
                        >
                          Inspect →
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
