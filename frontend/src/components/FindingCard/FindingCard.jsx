import React, { useState, useEffect } from "react";
import ClaimBadge from "../ClaimBadge/ClaimBadge";
import {
  ShieldAlert,
  Check,
  Edit3,
  XCircle,
  AlertOctagon,
  Sparkles,
  BookOpen,
  Cpu,
  Info,
  Clock,
  UserCheck,
  Volume2,
  VolumeX
} from "lucide-react";
import { speakText, stopSpeech, formatFindingForSpeech } from "../../utils/speech";

export default function FindingCard({
  finding,
  isSelected,
  onSelect,
  onAccept,
  onEdit,
  onReject,
  onDispute,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDisputing, setIsDisputing] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [editText, setEditText] = useState(finding.suggested_rewrite || finding.span_text || "");
  const [disputeReason, setDisputeReason] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isSpeakingThis, setIsSpeakingThis] = useState(false);

  useEffect(() => {
    return () => {
      if (isSpeakingThis) {
        stopSpeech();
      }
    };
  }, [isSpeakingThis]);

  const handleToggleReadAloud = () => {
    if (isSpeakingThis) {
      stopSpeech();
      setIsSpeakingThis(false);
    } else {
      const speechText = formatFindingForSpeech(finding);
      speakText(speechText, {
        onStart: () => setIsSpeakingThis(true),
        onEnd: () => setIsSpeakingThis(false),
        onError: () => setIsSpeakingThis(false),
      });
    }
  };

  const severityStyles = {
    high: "border-l-4 border-l-rose-500 bg-rose-50/20 dark:bg-rose-950/20",
    medium: "border-l-4 border-l-amber-500 bg-amber-50/20 dark:bg-amber-950/20",
    low: "border-l-4 border-l-sky-500 bg-sky-50/20 dark:bg-sky-950/20",
  };

  const categoryLabels = {
    tone: "Tone & Voice",
    terminology: "Glossary / Term",
    fact: "Fact Check",
    claim: "Claim Policy",
    accessibility: "Accessibility / WCAG",
    privacy: "Privacy & PII",
    visual: "Visual Brand",
  };

  const handleAccept = async () => {
    setSubmitting(true);
    await onAccept(finding.id);
    setSubmitting(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editText.trim()) return;
    setSubmitting(true);
    await onEdit(finding.id, editText, "Creator customized rewrite");
    setIsEditing(false);
    setSubmitting(false);
  };

  const handleDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    setSubmitting(true);
    await onDispute(finding.id, disputeReason);
    setIsDisputing(false);
    setSubmitting(false);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onReject(finding.id, rejectReason || "Creator rejected finding");
    setIsRejecting(false);
    setSubmitting(false);
  };

  const latestAction = finding.actions && finding.actions.length > 0 ? finding.actions[0] : null;

  return (
    <div
      onClick={onSelect}
      className={`rounded-xl border bg-white dark:bg-slate-900 p-4 transition-all shadow-xs ${
        isSelected ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-md" : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      } ${severityStyles[finding.severity] || ""}`}
    >
      {/* Header: Category & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {categoryLabels[finding.category] || finding.category}
          </span>
          {finding.origin === "image_ocr" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              🖼️ Image Claim (OCR)
            </span>
          )}
          {finding.origin === "visual_check" && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              🎨 Visual Brand Check
            </span>
          )}
          <span
            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
              finding.severity === "high"
                ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                : finding.severity === "medium"
                ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                : "bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800"
            }`}
          >
            {finding.severity} severity
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <ClaimBadge label={finding.claim_label} confidence={finding.confidence} />
        </div>
      </div>

      {/* Rule Name & Local Accessibility Voice Readout */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-slate-600 shrink-0" />
          {finding.rule}
        </h4>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleReadAloud();
          }}
          title={
            isSpeakingThis
              ? "Stop audio readout"
              : "Read finding aloud (Runs 100% locally on-device via Web Speech API)"
          }
          aria-label={isSpeakingThis ? "Stop reading finding aloud" : "Read finding aloud"}
          className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition-all shadow-2xs ${
            isSpeakingThis
              ? "bg-emerald-600 text-white animate-pulse"
              : "bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-800 border border-slate-200"
          }`}
        >
          {isSpeakingThis ? (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Stop Reading</span>
            </>
          ) : (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Read Aloud</span>
            </>
          )}
        </button>
      </div>

      {/* Highlighted flagged text excerpt */}
      <div className="mb-3 text-xs bg-slate-50 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
        <span className="text-slate-400 dark:text-slate-500 font-medium block text-[10px] uppercase mb-0.5">
          Flagged Text Segment:
        </span>
        <span className="font-mono text-rose-700 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 px-1 py-0.5 rounded">
          "{finding.span_text}"
        </span>
      </div>

      {/* Source Excerpt (Grounding Citation) */}
      {finding.source_excerpt && (
        <div className="mb-3 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 p-2.5 rounded-lg border border-emerald-100 dark:border-emerald-800/40">
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Approved Source Citation
            {finding.source_chunk_id && (
              <span className="ml-auto font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-normal">
                Chunk #{finding.source_chunk_id.slice(0, 8)}
              </span>
            )}
          </div>
          <p className="text-emerald-950 dark:text-emerald-200 italic leading-relaxed">
            "{finding.source_excerpt}"
          </p>
        </div>
      )}

      {/* Suggested Rewrite Box */}
      {finding.suggested_rewrite && (
        <div className="mb-3 text-xs bg-slate-900 text-white p-3 rounded-lg shadow-xs">
          <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider text-emerald-400 uppercase mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Suggested Rewrite (Preserves Intent)
            </span>
            <span className="text-slate-400 lowercase text-[9px]">AI-assisted</span>
          </div>
          <p className="text-slate-100 font-medium leading-relaxed">
            "{finding.suggested_rewrite}"
          </p>
        </div>
      )}

      {/* AI Disclosure Tag */}
      {finding.ai_disclosure && (
        <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-500 mb-3 pt-2 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <Cpu className="w-3 h-3 text-slate-400" />
            Model: <strong className="text-slate-700">{finding.ai_disclosure.model}</strong> ({finding.ai_disclosure.provider})
            {finding.ai_disclosure.image_source && (
              <span className="text-slate-400 font-mono ml-1">• Asset: {finding.ai_disclosure.image_source}</span>
            )}
          </span>
          {finding.ai_disclosure.redaction_applied && (
            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold text-[9px] flex items-center gap-0.5">
              🔒 Privacy Shield: Face & PII Masked
            </span>
          )}
        </div>
      )}

      {/* Past Action Audit Badge if acted upon */}
      {latestAction && (
        <div className="mb-3 p-2 bg-slate-100 rounded-lg text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
            <span className="font-semibold text-slate-800 capitalize">{latestAction.action}ed</span>
            <span className="text-slate-500">by {latestAction.actor_name || "User"}</span>
          </div>
          {latestAction.reason && (
            <span className="text-[11px] text-slate-600 italic truncate max-w-[150px]" title={latestAction.reason}>
              "{latestAction.reason}"
            </span>
          )}
        </div>
      )}

      {/* Interactive Action Forms (Edit, Dispute, Reject) */}
      {isEditing && (
        <form onSubmit={handleEditSubmit} className="mb-3 p-2.5 bg-slate-100 rounded-lg border border-slate-300">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Custom Replacement Text:
          </label>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={2}
            className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 outline-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
            >
              Save Edit
            </button>
          </div>
        </form>
      )}

      {isDisputing && (
        <form onSubmit={handleDisputeSubmit} className="mb-3 p-2.5 bg-amber-50 rounded-lg border border-amber-300">
          <label className="block text-xs font-bold text-amber-900 mb-1">
            Dispute Reason (Why is this guideline unclear or inaccurate?):
          </label>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            required
            rows={2}
            placeholder="Explain context or why the guideline rule needs updating..."
            className="w-full text-xs p-2 border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 outline-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsDisputing(false)}
              className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 disabled:opacity-50"
            >
              Record Dispute
            </button>
          </div>
        </form>
      )}

      {isRejecting && (
        <form onSubmit={handleRejectSubmit} className="mb-3 p-2.5 bg-rose-50 rounded-lg border border-rose-200">
          <label className="block text-xs font-bold text-rose-900 mb-1">
            Override Reason:
          </label>
          <input
            type="text"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Brief reason for rejecting finding..."
            className="w-full text-xs p-2 border border-rose-300 rounded-md outline-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              type="button"
              onClick={() => setIsRejecting(false)}
              className="px-2.5 py-1 text-xs text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
            >
              Confirm Override
            </button>
          </div>
        </form>
      )}

      {/* Human Oversight Action Buttons (Nothing is auto-applied!) */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 flex-wrap">
        <button
          onClick={handleAccept}
          disabled={submitting || latestAction?.action === "accept"}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            latestAction?.action === "accept"
              ? "bg-emerald-100 text-emerald-800 cursor-default"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          Accept Rewrite
        </button>

        <button
          onClick={() => {
            setIsEditing(!isEditing);
            setIsDisputing(false);
            setIsRejecting(false);
          }}
          disabled={submitting}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
        >
          <Edit3 className="w-3.5 h-3.5 text-slate-500" />
          Edit
        </button>

        <button
          onClick={() => {
            setIsRejecting(!isRejecting);
            setIsEditing(false);
            setIsDisputing(false);
          }}
          disabled={submitting}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200"
        >
          <XCircle className="w-3.5 h-3.5 text-slate-500" />
          Reject
        </button>

        <button
          onClick={() => {
            setIsDisputing(!isDisputing);
            setIsEditing(false);
            setIsRejecting(false);
          }}
          disabled={submitting}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 ml-auto"
        >
          <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
          Dispute
        </button>
      </div>
    </div>
  );
}
