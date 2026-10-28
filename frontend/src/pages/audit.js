import React, { useState, useEffect } from "react";
import AppShell from "../components/AppShell/AppShell";
import { api } from "../services/api";
import { History, Download, Filter, ShieldCheck, Cpu, UserCheck } from "lucide-react";

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);

  const loadLogs = async (evFilter) => {
    setLoading(true);
    try {
      const data = await api.getAuditLog(evFilter ? { event_type: evFilter } : {});
      setLogs(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs(eventTypeFilter);
  }, [eventTypeFilter]);

  const handleExportCsv = () => {
    window.open(api.getAuditExportUrl(), "_blank");
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <History className="w-6 h-6 text-emerald-600" />
              Immutable Governance Audit Trail
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Append-only compliance log recording source imports, submissions, model calls, overrides, and approvals.
            </p>
          </div>

          <button
            onClick={handleExportCsv}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export Audit Trail (CSV)
          </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center gap-2 flex-wrap text-xs">
          <Filter className="w-4 h-4 text-slate-400 ml-1 mr-1" />
          <span className="font-semibold text-slate-700">Filter Event:</span>
          {[
            "",
            "draft_created",
            "findings_generated",
            "image_redacted",
            "image_claims_analyzed",
            "finding_action",
            "external_model_call",
            "draft_approved",
            "source_imported",
          ].map((type) => (
            <button
              key={type}
              onClick={() => setEventTypeFilter(type)}
              className={`px-2.5 py-1 rounded-md font-medium capitalize transition-colors ${
                eventTypeFilter === type
                  ? "bg-slate-900 text-white font-semibold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {type ? type.replace(/_/g, " ") : "All Events"}
            </button>
          ))}
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No events found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3 text-left">Timestamp</th>
                    <th className="px-5 py-3 text-left">Event Type</th>
                    <th className="px-5 py-3 text-left">Actor</th>
                    <th className="px-5 py-3 text-left">Entity</th>
                    <th className="px-5 py-3 text-left">Metadata Audit Summary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white font-mono">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-md font-sans font-semibold text-[11px] capitalize ${
                            log.event_type.includes("approved")
                              ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                              : log.event_type.includes("model")
                              ? "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300"
                              : log.event_type.includes("action")
                              ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {log.event_type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-sans text-slate-800 font-medium">
                        {log.actor_name || "System"}
                      </td>
                      <td className="px-5 py-3 text-slate-600">
                        {log.entity_type} ({log.entity_id?.slice(0, 8)})
                      </td>
                      <td className="px-5 py-3 font-sans text-slate-600 text-xs max-w-md truncate" title={JSON.stringify(log.log_metadata)}>
                        {log.log_metadata ? JSON.stringify(log.log_metadata) : "—"}
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
