import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../store/auth";
import { ShieldCheck, ArrowRight, UserCheck, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to log in");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (demoEmail) => {
    setError("");
    setLoading(true);
    try {
      await login(demoEmail, "password123");
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Failed demo login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex items-center space-x-2.5 mb-4 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">
            Brand<span className="text-emerald-400">Guard</span>
          </span>
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-slate-100">
          Sign In to Governance Console
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Pre-publish verification for creators, brand managers, and legal reviewers
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-800/80 border border-slate-700 py-8 px-6 sm:px-10 rounded-2xl shadow-xl">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Work Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In with Credentials"}
            </button>
          </form>

          {/* Instant Demo Personas for Quick Hackathon Testing */}
          <div className="mt-6 pt-6 border-t border-slate-700">
            <span className="block text-center text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              One-Click Demo Personas
            </span>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin("creator@brandguard.io")}
                disabled={loading}
                className="w-full py-2 px-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>Creator (Alex Vance)</span>
                <span className="text-[10px] text-blue-400 font-mono">creator@brandguard.io</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("manager@brandguard.io")}
                disabled={loading}
                className="w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>Brand Manager (Elena Rostova)</span>
                <span className="text-[10px] text-emerald-400 font-mono">manager@brandguard.io</span>
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin("reviewer@brandguard.io")}
                disabled={loading}
                className="w-full py-2 px-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors"
              >
                <span>Legal Reviewer (Marcus Sterling)</span>
                <span className="text-[10px] text-purple-400 font-mono">reviewer@brandguard.io</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            Don't have a workspace?{" "}
            <Link href="/register" className="text-emerald-400 hover:underline font-semibold">
              Register New Organization
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
