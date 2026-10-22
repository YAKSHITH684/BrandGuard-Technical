import React, { useState, useEffect } from "react";
import AppShell from "../components/AppShell/AppShell";
import InsightsCharts from "../components/InsightsCharts/InsightsCharts";
import { api } from "../services/api";
import { BarChart3, RefreshCw } from "lucide-react";

export default function InsightsPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await api.getInsightsSummary();
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-emerald-600" />
              Brand Governance Insights & Guideline Feedback
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Continuous improvement analytics surfacing top violations, claim freshness, and most-disputed rules.
            </p>
          </div>

          <button
            onClick={loadSummary}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Computing workspace insights...</div>
        ) : (
          <InsightsCharts summary={summary} />
        )}
      </div>
    </AppShell>
  );
}
