import React, { useState, useEffect } from "react";
import AppShell from "../components/AppShell/AppShell";
import ReviewQueue from "../components/ReviewQueue/ReviewQueue";
import { api } from "../services/api";
import { useAuth } from "../store/auth";
import { CheckCircle2, ShieldAlert } from "lucide-react";

export default function ReviewsPage() {
  const { user } = useAuth();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadQueue = async () => {
    try {
      const data = await api.getReviewQueue();
      setQueue(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [user]);

  const handleApprove = async (draftId, note) => {
    try {
      await api.approveDraft(draftId, note);
      await loadQueue();
    } catch (err) {
      alert(err.message || "Approval failed");
    }
  };

  const handleRequestChanges = async (draftId, note) => {
    try {
      await api.requestChanges(draftId, note);
      await loadQueue();
    } catch (err) {
      alert(err.message || "Failed to request changes");
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            Governance Review & Approval Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-gated editorial sign-off. Sensitive or unsupported claims require Legal Reviewer approval.
          </p>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading approval queue...</div>
        ) : (
          <ReviewQueue
            queue={queue}
            onApprove={handleApprove}
            onRequestChanges={handleRequestChanges}
            userRole={user?.role}
          />
        )}
      </div>
    </AppShell>
  );
}
