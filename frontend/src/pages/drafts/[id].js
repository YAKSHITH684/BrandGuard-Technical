import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import AppShell from "../../components/AppShell/AppShell";
import DraftViewer from "../../components/DraftViewer/DraftViewer";
import FindingCard from "../../components/FindingCard/FindingCard";
import VersionDiff from "../../components/VersionDiff/VersionDiff";
import VoiceDictation from "../../components/VoiceDictation/VoiceDictation";
import { api } from "../../services/api";
import { useAuth } from "../../store/auth";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  History,
  GitCompare,
  MessageSquare,
  Send,
  Sparkles,
  ShieldCheck,
  Cpu,
  ArrowLeft,
  RefreshCw,
  Clock,
  Volume2,
  VolumeX
} from "lucide-react";
import { speakText, stopSpeech, formatFindingForSpeech } from "../../utils/speech";

export default function DraftDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("viewer"); // viewer | diff | revise | comments
  const [selectedFindingId, setSelectedFindingId] = useState(null);
  const [diffData, setDiffData] = useState(null);

  // New revision form state
  const [revisionContent, setRevisionContent] = useState("");
  const [submittingRev, setSubmittingRev] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Approval note state
  const [approvalNote, setApprovalNote] = useState("");
  const [submittingApproval, setSubmittingApproval] = useState(false);

  // Audio findings walkthrough state
  const [isReadingAll, setIsReadingAll] = useState(false);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  const loadDraft = async () => {
    if (!id) return;
    try {
      const data = await api.getDraft(id);
      setDraft(data);
      if (data.current_version_data) {
        setRevisionContent(data.current_version_data.content);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDraft();
  }, [id]);

  const loadDiff = async (fromV, toV) => {
    if (!id) return;
    try {
      const diff = await api.getVersionDiff(id, fromV, toV);
      setDiffData(diff);
      setActiveTab("diff");
    } catch (err) {
      alert("Failed to compute version diff: " + err.message);
    }
  };

  const handleAcceptFinding = async (findingId) => {
    try {
      await api.acceptFinding(findingId);
      // Auto-replace span in revisionContent if rewrite exists
      const finding = draft.current_version_data?.findings.find((f) => f.id === findingId);
      if (finding && finding.suggested_rewrite && revisionContent.includes(finding.span_text)) {
        setRevisionContent(revisionContent.replace(finding.span_text, finding.suggested_rewrite));
      }
      await loadDraft();
    } catch (err) {
      alert(err.message || "Failed to accept finding");
    }
  };

  const handleEditFinding = async (findingId, editedText, reason) => {
    try {
      await api.editFinding(findingId, editedText, reason);
      const finding = draft.current_version_data?.findings.find((f) => f.id === findingId);
      if (finding && revisionContent.includes(finding.span_text)) {
        setRevisionContent(revisionContent.replace(finding.span_text, editedText));
      }
      await loadDraft();
    } catch (err) {
      alert(err.message || "Failed to edit finding");
    }
  };

  const handleRejectFinding = async (findingId, reason) => {
    try {
      await api.rejectFinding(findingId, reason);
      await loadDraft();
    } catch (err) {
      alert(err.message || "Failed to reject finding");
    }
  };

  const handleDisputeFinding = async (findingId, reason) => {
    try {
      await api.disputeFinding(findingId, reason);
      await loadDraft();
    } catch (err) {
      alert(err.message || "Failed to dispute finding");
    }
  };

  const handlePostRevision = async (e) => {
    e.preventDefault();
    setSubmittingRev(true);
    try {
      await api.submitRevision(id, {
        title: draft.title,
        content: revisionContent,
      });
      await loadDraft();
      setActiveTab("viewer");
    } catch (err) {
      alert(err.message || "Failed to submit revision");
    } finally {
      setSubmittingRev(false);
    }
  };

  const handleSubmitForReview = async () => {
    try {
      await api.submitDraftForReview(id);
      await loadDraft();
    } catch (err) {
      alert(err.message || "Failed to submit for review");
    }
  };

  const handleApprove = async () => {
    setSubmittingApproval(true);
    try {
      await api.approveDraft(id, approvalNote);
      setApprovalNote("");
      await loadDraft();
    } catch (err) {
      alert(err.message || "Failed to approve");
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!approvalNote.trim()) {
      alert("Please provide notes on the revisions requested.");
      return;
    }
    setSubmittingApproval(true);
    try {
      await api.requestChanges(id, approvalNote);
      setApprovalNote("");
      await loadDraft();
    } catch (err) {
      alert(err.message || "Failed to request changes");
    } finally {
      setSubmittingApproval(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setPostingComment(true);
    try {
      await api.addComment(id, { body: commentText });
      setCommentText("");
      await loadDraft();
    } catch (err) {
      alert(err.message || "Failed to add comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleToggleReadAllFindings = () => {
    if (isReadingAll) {
      stopSpeech();
      setIsReadingAll(false);
      return;
    }

    if (!findings || findings.length === 0) return;

    setIsReadingAll(true);
    let idx = 0;

    const playNext = () => {
      if (idx >= findings.length) {
        setIsReadingAll(false);
        return;
      }
      const f = findings[idx];
      setSelectedFindingId(f.id);
      const text = `Finding ${idx + 1} of ${findings.length}. ${formatFindingForSpeech(f)}`;
      speakText(text, {
        onEnd: () => {
          idx++;
          playNext();
        },
        onError: () => {
          setIsReadingAll(false);
        }
      });
    };

    playNext();
  };

  if (loading || !draft) {
    return (
      <AppShell>
        <div className="p-12 text-center text-xs text-slate-400">Loading draft review console...</div>
      </AppShell>
    );
  }

  const findings = draft.current_version_data?.findings || [];
  const statusColors = {
    DRAFT: "bg-slate-100 text-slate-700 border-slate-300",
    IN_REVIEW: "bg-blue-100 text-blue-800 border-blue-300",
    CHANGES_REQUESTED: "bg-amber-100 text-amber-800 border-amber-300",
    DISPUTED: "bg-purple-100 text-purple-800 border-purple-300",
    APPROVED: "bg-emerald-100 text-emerald-800 border-emerald-300",
    REJECTED: "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <AppShell>
      <div className="space-y-4">
        {/* Top Control Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => router.push("/drafts")}
                  className="text-slate-400 hover:text-slate-700 mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${
                    statusColors[draft.status]
                  }`}
                >
                  {draft.status.replace("_", " ")}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Version {draft.current_version}
                </span>
                {draft.ai_status === "unavailable" && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">
                    ai_review: unavailable (deterministic only)
                  </span>
                )}
              </div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{draft.title}</h1>
              <div className="text-xs text-slate-500 mt-0.5">
                Author: <strong className="text-slate-700">{draft.author_name}</strong> · Flesch
                Reading Ease:{" "}
                <strong className="text-emerald-700">{draft.readability_score || "—"} / 100</strong>
              </div>
            </div>

            {/* Workflow Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {draft.status === "DRAFT" && (
                <button
                  onClick={handleSubmitForReview}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Submit for Approval
                </button>
              )}

              {user?.role !== "creator" && draft.status !== "APPROVED" && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={approvalNote}
                    onChange={(e) => setApprovalNote(e.target.value)}
                    placeholder="Approval / change note..."
                    className="text-xs p-2 border border-slate-300 rounded-lg w-44"
                  />
                  <button
                    onClick={handleApprove}
                    disabled={submittingApproval}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={handleRequestChanges}
                    disabled={submittingApproval}
                    className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-xl text-xs font-semibold"
                  >
                    Request Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Two-Pane Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Canvas: Draft Text & Tabs (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Tab navigation */}
            <div className="flex items-center gap-1 border-b border-slate-200 pb-2 text-xs font-semibold">
              <button
                onClick={() => setActiveTab("viewer")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === "viewer"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Draft with Highlights ({findings.length})
              </button>

              <button
                onClick={() => setActiveTab("revise")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === "revise"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Revise & Resubmit
              </button>

              {draft.current_version > 1 && (
                <button
                  onClick={() => loadDiff(draft.current_version - 1, draft.current_version)}
                  className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                    activeTab === "diff"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <GitCompare className="w-3.5 h-3.5" />
                  Version Diff (v{draft.current_version - 1} vs v{draft.current_version})
                </button>
              )}

              <button
                onClick={() => setActiveTab("comments")}
                className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === "comments"
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Comments ({draft.comments?.length || 0})
              </button>
            </div>

            {/* Tab 1: Interactive Draft Viewer */}
            {activeTab === "viewer" && (
              <div>
                <div className="text-xs text-slate-500 mb-2 flex items-center justify-between">
                  <span>Click any highlighted span to inspect the grounding rule & citation.</span>
                  <div className="flex gap-2">
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-rose-400"></span> High
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-amber-400"></span> Medium
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded bg-sky-400"></span> Low
                    </span>
                  </div>
                </div>

                {/* Multimodal Attached Visual Media Panel (Improvements 1, 2, 3) */}
                {draft.current_version_data?.images_data && draft.current_version_data.images_data.length > 0 && (
                  <div className="mb-4 bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs">
                          Multimodal Assets ({draft.current_version_data.images_data.length})
                        </span>
                        <span className="text-xs font-semibold text-slate-800">
                          Visual Media & OCR ClaimCheck
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        🔒 Privacy Shield Active
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {draft.current_version_data.images_data.map((img, i) => (
                        <div key={i} className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden flex flex-col justify-between">
                          {/* Image preview with blur */}
                          {img.url ? (
                            <div className="relative aspect-video bg-slate-900 border-b border-slate-200 overflow-hidden group">
                              <img
                                src={img.url}
                                alt={img.alt_text || img.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur text-white text-[10px] font-mono rounded">
                                {img.name}
                              </div>
                              {img.redaction_applied && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-600/90 backdrop-blur text-white text-[10px] font-semibold rounded flex items-center gap-1">
                                  🔒 Faces & PII Masked
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-4 bg-slate-900 text-white flex items-center justify-between text-xs font-mono">
                              <span>🖼️ {img.name}</span>
                              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-emerald-400">
                                Protected
                              </span>
                            </div>
                          )}

                          <div className="p-3 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700">Source: {img.agency || "Agency"}</span>
                              {img.contrast_ratio && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${img.contrast_ratio >= 4.5 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                                  {img.contrast_ratio}:1 Contrast
                                </span>
                              )}
                            </div>

                            {/* Privacy Redactions */}
                            {img.blurred_elements && img.blurred_elements.length > 0 && (
                              <div className="p-2 bg-emerald-50 rounded border border-emerald-100 text-[10px] text-emerald-950 space-y-0.5">
                                <span className="font-bold block uppercase tracking-wider text-emerald-800 text-[9px]">
                                  Irreversible Redactions Applied:
                                </span>
                                {img.blurred_elements.map((b, bi) => (
                                  <div key={bi} className="flex items-center gap-1 text-[10px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    <span>{b.label}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Extracted OCR text summary */}
                            {img.extracted_text && (
                              <div className="p-2 bg-white rounded border border-slate-200 text-[10px] text-slate-600 font-mono">
                                <span className="font-bold block text-slate-400 text-[9px] uppercase">OCR Extracted Copy:</span>
                                <p className="truncate" title={img.extracted_text}>"{img.extracted_text}"</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <DraftViewer
                  content={draft.current_version_data?.content}
                  findings={findings}
                  selectedFindingId={selectedFindingId}
                  onSelectFinding={(fId) => setSelectedFindingId(fId)}
                />
              </div>
            )}

            {/* Tab 2: Revision Editor */}
            {activeTab === "revise" && (
              <form onSubmit={handlePostRevision} className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500">
                    Accepted rewrites automatically populate below. Tweak text and resubmit to trigger version {draft.current_version + 1}.
                  </div>
                  <VoiceDictation
                    onTranscript={(newSpeech) => {
                      setRevisionContent((prev) => (prev ? `${prev} ${newSpeech}` : newSpeech));
                    }}
                    hasImagesOrRedaction={Boolean(draft.current_version_data?.images_data && draft.current_version_data.images_data.length > 0)}
                    disabledReason={
                      draft.current_version_data?.images_data && draft.current_version_data.images_data.length > 0
                        ? "Voice dictation disabled: Draft contains multimodal assets with potential sensitive/redacted data."
                        : ""
                    }
                  />
                </div>
                <textarea
                  rows={14}
                  value={revisionContent}
                  onChange={(e) => setRevisionContent(e.target.value)}
                  className="w-full text-xs font-mono p-4 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed bg-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="submit"
                    disabled={submittingRev}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${submittingRev ? "animate-spin" : ""}`} />
                    {submittingRev ? "Rerunning Review Pipeline..." : `Save Version ${draft.current_version + 1} & Rerun Review`}
                  </button>
                </div>
              </form>
            )}

            {/* Tab 3: Version Diff */}
            {activeTab === "diff" && <VersionDiff diffData={diffData} />}

            {/* Tab 4: Threaded Comments */}
            {activeTab === "comments" && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-900">
                  Editorial Discussion ({draft.comments?.length || 0})
                </h3>

                <div className="space-y-3 divide-y divide-slate-100">
                  {draft.comments?.map((c) => (
                    <div key={c.id} className="pt-3 first:pt-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-800">
                          {c.author_name} ({c.author_role})
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{c.body}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddComment} className="pt-4 border-t border-slate-200 flex gap-2">
                  <input
                    type="text"
                    required
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment or legal note..."
                    className="flex-1 text-xs p-2.5 border border-slate-300 rounded-xl outline-none"
                  />
                  <button
                    type="submit"
                    disabled={postingComment}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold"
                  >
                    Post
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Pane: Explainable Finding Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Explainable Findings ({findings.length})
              </span>
              <div className="flex items-center gap-2">
                {findings.length > 0 && (
                  <button
                    type="button"
                    onClick={handleToggleReadAllFindings}
                    title={
                      isReadingAll
                        ? "Stop audio readout"
                        : "Listen to audio walkthrough of findings (Local TTS)"
                    }
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition shadow-2xs ${
                      isReadingAll
                        ? "bg-emerald-600 text-white animate-pulse"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    {isReadingAll ? (
                      <>
                        <VolumeX className="w-3 h-3" />
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3 h-3 text-emerald-600" />
                        <span>Read All Aloud</span>
                      </>
                    )}
                  </button>
                )}
                <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                  Human-in-the-loop review
                </span>
              </div>
            </div>

            {findings.length === 0 ? (
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-950">100% Brand & Policy Compliant!</h4>
                <p className="text-xs text-emerald-800 mt-1">
                  No terminology violations, unsupported claims, or tone issues were detected.
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                {findings.map((f) => (
                  <FindingCard
                    key={f.id}
                    finding={f}
                    isSelected={selectedFindingId === f.id}
                    onSelect={() => setSelectedFindingId(f.id)}
                    onAccept={handleAcceptFinding}
                    onEdit={handleEditFinding}
                    onReject={handleRejectFinding}
                    onDispute={handleDisputeFinding}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
