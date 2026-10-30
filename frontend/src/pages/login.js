import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../store/auth";
import { api } from "../services/api";
import ThemeToggle from "../components/ThemeToggle/ThemeToggle";
import {
  ShieldCheck,
  ArrowRight,
  UserCheck,
  Lock,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  X,
  Eye,
  EyeOff,
  Sparkles,
  RefreshCw
} from "lucide-react";

export default function LoginPage() {
  const { login, resetPassword } = useAuth();
  const router = useRouter();

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Server health & cold-start indicator
  const [backendStatus, setBackendStatus] = useState("checking"); // checking | online | waking
  const [backendInfo, setBackendInfo] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let pollInterval = null;

    const check = async () => {
      try {
        const info = await api.checkBackendHealth();
        if (isMounted) {
          setBackendStatus("online");
          setBackendInfo(info);
          if (pollInterval) clearInterval(pollInterval);
        }
      } catch (err) {
        if (isMounted) {
          setBackendStatus("waking");
        }
      }
    };

    check();
    pollInterval = setInterval(check, 2500);

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, []);

  const handleSwitchBackend = async (target) => {
    setBackendStatus("checking");
    if (target === "local") {
      api.setApiBase(api.LOCAL_API_URL);
    } else {
      api.setApiBase(api.RENDER_API_URL);
    }
    try {
      const info = await api.checkBackendHealth(2000);
      setBackendStatus("online");
      setBackendInfo(info);
    } catch (e) {
      setBackendStatus("waking");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password");
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

  const openForgotPassword = () => {
    setResetEmail(email.trim());
    setResetError("");
    setResetSuccess("");
    setShowForgotModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");

    if (!resetEmail || !resetEmail.includes("@")) {
      setResetError("Please enter a valid email address.");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setResetError("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      await resetPassword(resetEmail, newPassword);
      setResetSuccess("Password reset successfully! Redirecting you to console...");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1200);
    } catch (err) {
      setResetError(err.message || "Failed to reset password. Please verify the email.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-emerald-500 selection:text-white">
      {/* Theme Switcher */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full"></div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
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

        {/* Server Status Pill */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium bg-slate-800/80 border border-slate-700/80">
          <span
            className={`w-2 h-2 rounded-full ${
              backendStatus === "online"
                ? "bg-emerald-400 shadow-sm shadow-emerald-400"
                : "bg-amber-400 animate-pulse"
            }`}
          />
          <span className="text-slate-300">
            {backendStatus === "online"
              ? `Backend Online (${backendInfo?.is_local ? "Local :8000" : "Cloud"} · ${backendInfo?.ping_ms || 10}ms)`
              : "Connecting to Backend..."}
          </span>
          {backendStatus !== "online" && (
            <button
              type="button"
              onClick={() => handleSwitchBackend("local")}
              className="ml-1 px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] font-semibold transition-colors"
              title="Connect to local backend server at http://localhost:8000"
            >
              Use Local :8000
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 py-8 px-6 sm:px-10 rounded-2xl shadow-xl">
          {/* Error Banner with Prominent Forgot Password Link */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span className="font-semibold">{error}</span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-rose-500/20 flex items-center justify-between">
                <span className="text-[11px] text-slate-300">Forgot your password?</span>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="font-bold text-emerald-400 hover:text-emerald-300 underline flex items-center gap-1 transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  Reset Password Now
                </button>
              </div>
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
                className="w-full text-xs px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  onClick={openForgotPassword}
                  className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                "Sign In with Credentials"
              )}
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

      {/* Forgot / Reset Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Account Password</h3>
                <p className="text-xs text-slate-400">
                  Update your credentials to restore instant console access.
                </p>
              </div>
            </div>

            {/* Hint Box */}
            <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
              <span className="font-semibold block mb-0.5">💡 Demo Account Tip:</span>
              Default password for all demo personas is <code className="bg-slate-950/60 px-1 py-0.5 rounded text-white font-mono">password123</code>. You can also specify any new password below.
            </div>

            {resetError && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Account Work Email
                </label>
                <input
                  type="email"
                  required
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="creator@brandguard.io"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  New Password (min 6 chars)
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full text-xs px-3.5 py-2.5 pr-10 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full text-xs px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {resetLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Save & Sign In</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
