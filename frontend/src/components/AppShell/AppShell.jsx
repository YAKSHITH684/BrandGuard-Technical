import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../store/auth";
import GroqChatBot from "../GroqChatBot/GroqChatBot";
import ThemeToggle from "../ThemeToggle/ThemeToggle";
import {
  ShieldCheck,
  LayoutDashboard,
  FileText,
  FilePlus2,
  FolderGit2,
  BarChart3,
  History,
  Settings,
  CheckCircle2,
  LogOut,
  UserCheck,
  AlertCircle,
  Menu,
  X,
  Mic
} from "lucide-react";

export default function AppShell({ children }) {
  const { user, logout, switchRole } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Drafts", href: "/drafts", icon: FileText },
    { name: "New Draft", href: "/drafts/new", icon: FilePlus2 },
    { name: "Voice Agent", href: "/voice", icon: Mic },
    { name: "Review Queue", href: "/reviews", icon: CheckCircle2, roles: ["brand_manager", "reviewer"] },
    { name: "Approved Sources", href: "/sources", icon: FolderGit2, roles: ["brand_manager"] },
    { name: "Insights", href: "/insights", icon: BarChart3, roles: ["brand_manager"] },
    { name: "Audit Trail", href: "/audit", icon: History },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  const currentRole = user?.role || "creator";

  const roleLabels = {
    creator: { label: "Creator", bg: "bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800" },
    brand_manager: { label: "Brand Manager", bg: "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800" },
    reviewer: { label: "Legal Reviewer", bg: "bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800" },
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/dashboard" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Brand<span className="text-emerald-600 dark:text-emerald-400">Guard</span>
                </span>
                <span className="hidden sm:inline-block ml-2 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full border border-slate-200 dark:border-slate-700">
                  Governance
                </span>
              </div>
            </Link>

            {user?.workspace?.name && (
              <div className="hidden md:flex items-center space-x-1.5 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{user.workspace.name}</span>
              </div>
            )}
          </div>

          {/* Quick Role Switcher, Theme Switcher & User Profile */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Persona Switcher Pill */}
            <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium px-2 py-0.5">Role:</span>
              <button
                onClick={() => switchRole("creator")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  currentRole === "creator"
                    ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Creator
              </button>
              <button
                onClick={() => switchRole("brand_manager")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  currentRole === "brand_manager"
                    ? "bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Brand Mgr
              </button>
              <button
                onClick={() => switchRole("reviewer")}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  currentRole === "reviewer"
                    ? "bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Legal
              </button>
            </div>

            {/* Light / Dark Theme Switcher */}
            <ThemeToggle />

            {user && (
              <div className="flex items-center space-x-2 pl-1 sm:pl-2">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{user.email}</div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:block w-60 shrink-0">
          <nav className="sticky top-24 space-y-1.5">
            {navigation.map((item) => {
              const active = router.pathname === item.href || (item.href !== "/dashboard" && router.pathname.startsWith(item.href) && item.href !== "/drafts/new");
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all ${
                    active
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : "text-slate-400 dark:text-slate-500"}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
              <div className="px-3.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
                Governance Status
              </div>
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5 shadow-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Readability Target:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">60.0 (Standard)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Confidence Gate:</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">65% Min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-slate-400">Active Persona:</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${roleLabels[currentRole]?.bg}`}>
                    {roleLabels[currentRole]?.label}
                  </span>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex">
            <div className="w-64 bg-white dark:bg-slate-900 h-full p-4 flex flex-col shadow-xl border-r border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <span className="font-bold text-slate-900 dark:text-white">BrandGuard Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Theme switcher in mobile navigation */}
              <div className="py-3 border-b border-slate-200 dark:border-slate-800">
                <div className="font-medium text-xs text-slate-500 dark:text-slate-400 mb-2">Display Theme:</div>
                <ThemeToggle variant="segmented" className="w-full justify-between" />
              </div>

              <nav className="mt-3 space-y-1 flex-1 overflow-y-auto">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <item.icon className="w-4 h-4 text-slate-400" />
                    <span>{item.name}</span>
                  </Link>
                ))}
              </nav>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div className="font-medium text-slate-500 dark:text-slate-400 mb-2">Switch Persona:</div>
                <div className="flex gap-1 flex-wrap">
                  {["creator", "brand_manager", "reviewer"].map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setMobileMenuOpen(false);
                      }}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded text-xs font-semibold capitalize"
                    >
                      {r.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Canvas */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>

      {/* Floating Groq AI Governance Assistant */}
      <GroqChatBot />
    </div>
  );
}
