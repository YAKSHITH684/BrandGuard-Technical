import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../store/auth";
import { api } from "../services/api";
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
  EyeOff,
  Zap,
  RefreshCw
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [entering, setEntering] = useState(false);
  const [backendReady, setBackendReady] = useState(false);

  // Pre-warm backend immediately on visit to eliminate cold-start delays
  useEffect(() => {
    let isMounted = true;
    api
      .checkBackendHealth()
      .then(() => {
        if (isMounted) setBackendReady(true);
      })
      .catch(() => {
        // Retry silently to warm up Render container
        setTimeout(() => {
          api
            .checkBackendHealth()
            .then(() => isMounted && setBackendReady(true))
            .catch(() => {});
        }, 3000);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleFastEnter = async (personaRole = "creator") => {
    setEntering(true);
    if (user) {
      router.push("/dashboard");
      return;
    }

    const personaEmails = {
      creator: "creator@brandguard.io",
      manager: "manager@brandguard.io",
      reviewer: "reviewer@brandguard.io",
    };

    try {
      const email = personaEmails[personaRole] || "creator@brandguard.io";
      await login(email, "password123");
      router.push("/dashboard");
    } catch (err) {
      // Fallback directly to login page if immediate token generation fails
      router.push("/login");
    } finally {
      setEntering(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight">
              Brand<span className="text-emerald-400">Guard</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-semibold px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700">
              AI Governance
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Cloud server live pulse */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 border border-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                backendReady
                  ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                  : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="text-slate-300">
              {backendReady ? "Cloud Online (Fast)" : "Connecting..."}
            </span>
          </div>

          <Link
            href="/login"
            className="text-xs font-semibold text-slate-300 hover:text-white transition-colors px-3 py-2"
          >
            Sign In
          </Link>
          <button
            onClick={() => handleFastEnter("creator")}
            disabled={entering}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50"
          >
            {entering ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Entering...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Launch Console</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-14 text-center">
        {/* Small Title Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          BrandGuard · AI Pre-Publish Brand Governance
        </div>

        {/* Small, Punchy Main Title */}
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto leading-tight text-white">
          Explainable Brand Governance &{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            Claim Verification
          </span>
        </h1>

        <p className="mt-4 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Catch banned terms, outdated facts, and ungrounded superlatives{" "}
          <strong className="text-slate-200">before</strong> content goes live. Every finding cites an approved guideline excerpt with human-in-the-loop oversight.
        </p>

        {/* Fast Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => handleFastEnter("creator")}
            disabled={entering}
            className="w-full sm:w-auto px-7 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 disabled:opacity-50"
          >
            {entering ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Entering Console...</span>
              </>
            ) : (
              <>
                <span>Enter Governance Console (Fast)</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm border border-slate-700 transition-all flex items-center justify-center"
          >
            Sign In with Password
          </Link>
        </div>

        {/* 1-Click Fast Persona Switcher */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="text-slate-400">⚡ Instant 1-Click Entrance:</span>
          <button
            onClick={() => handleFastEnter("creator")}
            disabled={entering}
            className="px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 font-medium transition-colors"
          >
            Alex Vance (Creator)
          </button>
          <button
            onClick={() => handleFastEnter("manager")}
            disabled={entering}
            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-medium transition-colors"
          >
            Elena Rostova (Brand Mgr)
          </button>
          <button
            onClick={() => handleFastEnter("reviewer")}
            disabled={entering}
            className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 font-medium transition-colors"
          >
            Marcus Sterling (Legal)
          </button>
        </div>
      </section>

      {/* Core Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 border-t border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Grounding & Source Citations</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              No black-box verdicts. Every flag links directly to an approved guideline section or dated fact sheet chunk with exact chapter and line citations.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Privacy & PII Redaction Layer</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Automated client-side redaction detects emails, phones, API keys, and secrets before invoking external Groq LLM endpoints.
            </p>
          </div>

          <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700/60">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Guideline Feedback Loop</h3>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Surfaces most-overridden and disputed rules back to brand managers so ambiguous brand guidelines continuously improve over time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        BrandGuard · Inkloom AI Hackathon Round 2: The Build · Fully Isolated Workspace Brand Governance
      </footer>
    </div>
  );
}
