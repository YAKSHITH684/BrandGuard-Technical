import React from "react";
import { GitCompare, PlusCircle, MinusCircle } from "lucide-react";

export default function VersionDiff({ diffData }) {
  if (!diffData || !diffData.diff_lines) {
    return (
      <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
        No revision diff available for these versions.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
          <GitCompare className="w-4 h-4 text-emerald-600" />
          <span>
            Comparing <span className="text-slate-900 font-bold">Version {diffData.from_version}</span> →{" "}
            <span className="text-emerald-700 font-bold">Version {diffData.to_version}</span>
          </span>
        </div>
      </div>

      <div className="p-4 font-mono text-xs overflow-x-auto divide-y divide-slate-100">
        {diffData.diff_lines.map((line, index) => {
          if (line.type === "added") {
            return (
              <div
                key={index}
                className="flex items-start gap-2.5 py-1 px-2 bg-emerald-50 text-emerald-900 rounded my-0.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{line.text}</span>
              </div>
            );
          }
          if (line.type === "removed") {
            return (
              <div
                key={index}
                className="flex items-start gap-2.5 py-1 px-2 bg-rose-50 text-rose-900 rounded line-through opacity-80 my-0.5"
              >
                <MinusCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap">{line.text}</span>
              </div>
            );
          }
          return (
            <div key={index} className="flex items-start gap-2.5 py-1 px-2 text-slate-600">
              <span className="w-3.5 shrink-0" />
              <span className="whitespace-pre-wrap">{line.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
