import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  Lock,
  Sparkles,
  BookOpen,
  ArrowRight,
  BarChart3,
  Users2,
  FileSearch,
  EyeOff
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Brand<span className="text-emerald-400">Guard</span>
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20"
          >
            Launch Console
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-8">
          <Sparkles className="w-3.5 h-3.5" />
          Inkloom AI Hackathon · Round 2 Build
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Explainable Pre-Publish <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Brand Governance & Claim Verification
          </span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Catch banned terms, outdated benchmark figures, and unsubstantiated superlatives{" "}
          <strong className="text-slate-200">before</strong> content goes live. Every finding cites an approved source excerpt with human-in-the-loop oversight.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
          >
            Enter Governance Console
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="w-full sm:w-auto px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-base border border-slate-700 transition-all"
          >
            Demo Persona Sign In
          </Link>
        </div>
      </section>

      {/* Core Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Grounding & Source Citations</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              No black-box verdicts. Every flag links directly to an approved guideline section or dated fact sheet chunk with exact chapter and line citations.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Privacy & PII Redaction Layer</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Automated client-side redaction detects emails, phones, API keys, and secrets before invoking external Groq LLM endpoints.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Guideline Feedback Loop</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Surfaces most-overridden and disputed rules back to brand managers so ambiguous brand guidelines continuously improve over time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        BrandGuard · Inkloom AI Hackathon Round 2: The Build · Fully Isolated Workspace Brand Governance
      </footer>
    </div>
  );
}
