import React from "react";

export default function DraftViewer({ content, findings, selectedFindingId, onSelectFinding }) {
  if (!content) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        No draft content available.
      </div>
    );
  }

  // Build segmented text with span highlights
  // Filter findings that have span_start and span_end within content length
  const validFindings = findings.filter(
    (f) => f.span_start >= 0 && f.span_end <= content.length && f.span_end > f.span_start
  );

  // Sort by start index
  validFindings.sort((a, b) => a.span_start - b.span_start);

  const elements = [];
  let currentIndex = 0;

  validFindings.forEach((f, idx) => {
    // If there's an overlap with previous index, skip or adjust
    if (f.span_start < currentIndex) return;

    // Plain text before highlight
    if (f.span_start > currentIndex) {
      elements.push(
        <span key={`text-${currentIndex}`}>
          {content.slice(currentIndex, f.span_start)}
        </span>
      );
    }

    // Highlighted span
    const isSelected = selectedFindingId === f.id;
    const severityClass =
      f.severity === "high"
        ? "span-highlight-high"
        : f.severity === "medium"
        ? "span-highlight-medium"
        : "span-highlight-low";

    elements.push(
      <mark
        key={`finding-${f.id}-${idx}`}
        onClick={() => onSelectFinding(f.id)}
        className={`${severityClass} ${isSelected ? "span-highlight-active" : ""}`}
        title={`${f.rule} (${f.severity} severity) - Click to review`}
      >
        {content.slice(f.span_start, f.span_end)}
      </mark>
    );

    currentIndex = f.span_end;
  });

  // Remaining plain text
  if (currentIndex < content.length) {
    elements.push(
      <span key={`text-end`}>{content.slice(currentIndex)}</span>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap select-text">
      {elements}
    </div>
  );
}
