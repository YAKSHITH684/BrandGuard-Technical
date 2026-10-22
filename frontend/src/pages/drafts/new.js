import React, { useState } from "react";
import { useRouter } from "next/router";
import AppShell from "../../components/AppShell/AppShell";
import { api } from "../../services/api";
import {
  FilePlus2,
  Upload,
  Palette,
  Image as ImageIcon,
  Sparkles,
  AlertCircle,
  Eye,
  CheckCircle2
} from "lucide-react";

export default function NewDraftPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Accessibility & Color pair states
  const [enableColorCheck, setEnableColorCheck] = useState(false);
  const [foreground, setForeground] = useState("#9CA3AF");
  const [background, setBackground] = useState("#FFFFFF");
  const [colorLabel, setColorLabel] = useState("Hero Subtitle Text");
  const [contrastResult, setContrastResult] = useState(null);

  // Alt text states
  const [enableAltTextCheck, setEnableAltTextCheck] = useState(false);
  const [imageName, setImageName] = useState("infographic_banner.png");
  const [altText, setAltText] = useState("");

  const handleTestContrast = async () => {
    try {
      const res = await api.checkContrast(foreground, background);
      setContrastResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadSample = (type) => {
    if (type === "violating") {
      setTitle("Acme LiveSync 2.0 Product Launch Press Release");
      setContent(`# Introducing Acme LiveSync 2.0: The World's Best Streaming Engine

We are thrilled to announce HyperSync 2.0, the fastest data replication engine on the planet. Unlike cheap alternatives and inferior legacy architectures, our platform delivers guaranteed results with zero downtime.

Acme LiveSync processes 2.4 million events per second with sub-5ms latency across 12 regions, verified in independent tests. Our cloud infrastructure maintains a 99.85% uptime guarantee, ensuring your mission-critical applications run seamlessly.

To upgrade your existing cluster or talk to our lead enterprise architect Alex (reach out at alex.vance@acmecorp.internal or call 415-555-0199), click here right now.

![Performance Benchmark Graph]()`);
      setEnableColorCheck(true);
      setForeground("#9CA3AF");
      setBackground("#FFFFFF");
      setColorLabel("Callout Subtitle Text");
    } else {
      setTitle("Acme SOC2 Type II Attestation Summary");
      setContent(`# Enterprise Security & Architecture Attestation

Acme serves over 4,200 enterprise organizations across 45 countries with an active SOC2 Type II compliance certification. All data at rest utilizes AES-256 encryption with customer-managed keys (KMS).

For detailed security whitepapers and verification reports, explore the Acme Trust Center.`);
      setEnableColorCheck(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setError("");
    setSubmitting(true);

    try {
      const colorPairs = enableColorCheck
        ? [{ foreground, background, label: colorLabel, font_size: "normal" }]
        : [];

      const altTexts = enableAltTextCheck
        ? [{ image_name: imageName, alt_text: altText }]
        : [];

      const created = await api.createDraft({
        title,
        content,
        color_pairs: colorPairs,
        alt_texts: altTexts,
      });

      router.push(`/drafts/${created.id}`);
    } catch (err) {
      setError(err.message || "Failed to submit draft");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <FilePlus2 className="w-6 h-6 text-emerald-600" />
              Submit Draft for Pre-Publish Governance
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly audit text for brand tone, verified claims, dated facts, and accessibility.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Quick Preset:</span>
            <button
              type="button"
              onClick={() => handleLoadSample("violating")}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold"
            >
              Load Sample Violations
            </button>
            <button
              type="button"
              onClick={() => handleLoadSample("clean")}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold"
            >
              Load Compliant Draft
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Draft Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q2 Product Launch Announcement"
                className="w-full text-sm font-semibold p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                Draft Content (Text or Markdown)
              </label>
              <textarea
                required
                rows={12}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste or write your marketing copy, blog post, or whitepaper segment here..."
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
            </div>
          </div>

          {/* Optional Checks Accordion */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Palette className="w-4 h-4 text-emerald-600" />
              Design & Accessibility Inputs (WCAG 2.1 AA)
            </h3>

            {/* Color Contrast */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableColorCheck}
                    onChange={(e) => setEnableColorCheck(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Evaluate Color Contrast (WCAG 4.5:1 Target)
                </label>
                {enableColorCheck && (
                  <button
                    type="button"
                    onClick={handleTestContrast}
                    className="text-[11px] font-semibold text-emerald-700 hover:underline"
                  >
                    Test Contrast Live
                  </button>
                )}
              </div>

              {enableColorCheck && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Foreground Text Hex
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={foreground}
                        onChange={(e) => setForeground(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={foreground}
                        onChange={(e) => setForeground(e.target.value)}
                        className="text-xs p-1.5 border border-slate-300 rounded font-mono w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Background Hex
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="text-xs p-1.5 border border-slate-300 rounded font-mono w-24"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Element Label
                    </label>
                    <input
                      type="text"
                      value={colorLabel}
                      onChange={(e) => setColorLabel(e.target.value)}
                      placeholder="e.g. Card Header"
                      className="text-xs p-1.5 border border-slate-300 rounded w-full"
                    />
                  </div>
                </div>
              )}

              {contrastResult && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium flex items-center justify-between ${
                    contrastResult.passes_aa
                      ? "bg-emerald-100 text-emerald-900 border border-emerald-200"
                      : "bg-rose-100 text-rose-900 border border-rose-200"
                  }`}
                >
                  <span>{contrastResult.message}</span>
                  <span className="font-bold">{contrastResult.contrast_ratio}:1</span>
                </div>
              )}
            </div>

            {/* Asset Alt Text */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAltTextCheck}
                  onChange={(e) => setEnableAltTextCheck(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Attach Image Asset for Alt Text Linter
              </label>

              {enableAltTextCheck && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Asset Filename
                    </label>
                    <input
                      type="text"
                      value={imageName}
                      onChange={(e) => setImageName(e.target.value)}
                      className="text-xs p-1.5 border border-slate-300 rounded w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
                      Proposed Alt Text
                    </label>
                    <input
                      type="text"
                      value={altText}
                      onChange={(e) => setAltText(e.target.value)}
                      placeholder="e.g. Quarterly chart showing 28% CPU reduction"
                      className="text-xs p-1.5 border border-slate-300 rounded w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push("/drafts")}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? "Running Review Pipeline..." : "Run Governance Review"}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
