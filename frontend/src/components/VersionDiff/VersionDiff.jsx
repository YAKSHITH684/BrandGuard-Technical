import React from "react";
import { GitCompare, PlusCircle, MinusCircle } from "lucide-react";

export default function VersionDiff({ diffData }) {
  if (!diffData || !diffData.diff_lines) {
    return (
      <div className="p-8 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        No revision diff available for these versions.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <GitCompare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>
            Comparing <span className="text-slate-900 dark:text-slate-100 font-bold">Version {diffData.from_version}</span> →{" "}
            <span className="text-emerald-700 dark:text-emerald-400 font-bold">Version {diffData.to_version}</span>
          </span>
        </div>
      </div>

      <div className="p-4 font-mono text-xs overflow-x-auto divide-y divide-slate-100 dark:divide-slate-800">
        {diffData.diff_lines.map((line, index) => {
          if (line.type === "added") {
            return (
              <div
                key={index}
                className="flex items-start gap-2.5 py-1 px-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 rounded my-0.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{line.text}</span>
              </div>
            );
          }
          if (line.type === "removed") {
            return (
              <div
                key={index}
                className="flex items-start gap-2.5 py-1 px-2 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-200 rounded line-through opacity-80 my-0.5"
              >
                <MinusCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{line.text}</span>
              </div>
            );
          }
          return (
            <div key={index} className="flex items-start gap-2.5 py-1 px-2 text-slate-600 dark:text-slate-400">
              <span className="w-3.5 shrink-0" />
              <span className="whitespace-pre-wrap">{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
