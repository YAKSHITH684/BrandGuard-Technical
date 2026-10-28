import React, { useState, useRef, useEffect } from "react";
import { useTheme } from "../../store/theme";
import { Sun, Moon, Laptop, Check, ChevronDown } from "lucide-react";

export default function ThemeToggle({ variant = "button", className = "" }) {
  const { theme, resolvedTheme, setTheme, toggleTheme, mounted } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Avoid layout shifts prior to mounting
  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50 animate-pulse ${className}`}
        aria-hidden="true"
      />
    );
  }

  const options = [
    {
      id: "light",
      label: "Light",
      description: "Crisp white interface for high-brightness settings",
      icon: Sun,
      iconColor: "text-amber-500",
      activeBg: "bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200",
    },
    {
      id: "dark",
      label: "Dark",
      description: "Sleek dark theme reducing eye fatigue",
      icon: Moon,
      iconColor: "text-indigo-400",
      activeBg: "bg-indigo-50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200",
    },
    {
      id: "system",
      label: "System",
      description: "Follows your operating system color preference",
      icon: Laptop,
      iconColor: "text-emerald-500",
      activeBg: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200",
    },
  ];

  // -------------------------------------------------------------
  // Variant: "cards" (Rich visual selection for Settings page)
  // -------------------------------------------------------------
  if (variant === "cards") {
    return (
      <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTheme(opt.id)}
              className={`relative flex flex-col text-left p-4 rounded-2xl border-2 transition-all duration-200 group ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Mini visual mockup preview */}
              <div
                className={`w-full h-20 rounded-xl mb-3 p-2 flex flex-col justify-between overflow-hidden border ${
                  opt.id === "light"
                    ? "bg-slate-50 border-slate-200"
                    : opt.id === "dark"
                    ? "bg-slate-950 border-slate-800"
                    : "bg-gradient-to-r from-slate-100 to-slate-950 border-slate-300 dark:border-slate-700"
                }`}
              >
                {/* Mock header bar */}
                <div className="flex items-center justify-between pb-1.5 border-b border-black/10 dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        opt.id === "dark" ? "bg-emerald-400" : "bg-emerald-600"
                      }`}
                    />
                    <div
                      className={`w-10 h-1.5 rounded-full ${
                        opt.id === "dark" ? "bg-slate-700" : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <div
                    className={`w-3 h-1.5 rounded-full ${
                      opt.id === "dark" ? "bg-slate-800" : "bg-slate-200"
                    }`}
                  />
                </div>
                {/* Mock content blocks */}
                <div className="space-y-1">
                  <div
                    className={`w-3/4 h-1.5 rounded-full ${
                      opt.id === "dark" ? "bg-slate-700" : "bg-slate-300"
                    }`}
                  />
                  <div
                    className={`w-1/2 h-1.5 rounded-full ${
                      opt.id === "dark" ? "bg-slate-800" : "bg-slate-200"
                    }`}
                  />
                </div>
              </div>

              {/* Header with Title and Icon */}
              <div className="flex items-center justify-between w-full mb-1">
                <div className="flex items-center gap-2">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isSelected
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {opt.label}
                  </span>
                </div>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                {opt.description}
              </p>

              {opt.id === "system" && isSelected && (
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>
                    Currently resolved as{" "}
                    <strong className="text-emerald-600 dark:text-emerald-400 capitalize">
                      {resolvedTheme}
                    </strong>
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Variant: "segmented" (Pill group with 3 buttons)
  // -------------------------------------------------------------
  if (variant === "segmented") {
    return (
      <div
        className={`inline-flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs ${className}`}
        role="radiogroup"
        aria-label="Theme mode"
      >
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = theme === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setTheme(opt.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all duration-150 ${
                isSelected
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isSelected ? opt.iconColor : ""}`} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // -------------------------------------------------------------
  // Variant: "button" (Default for Navbar header with quick toggle & dropdown)
  // -------------------------------------------------------------
  const CurrentIcon =
    theme === "system" ? Laptop : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800/80 p-0.5 border border-slate-200 dark:border-slate-700/80 shadow-2xs hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
        {/* Main 1-click toggle button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode (Currently ${resolvedTheme})`}
          aria-label={`Current theme: ${theme}. Click to switch theme.`}
          className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition-all duration-150 flex items-center justify-center group focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          {resolvedTheme === "dark" ? (
            <Moon className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          ) : (
            <Sun className="w-4 h-4 text-amber-500 group-hover:rotate-45 transition-transform" />
          )}
        </button>

        {/* Dropdown chevron to pick Light / Dark / System explicitly */}
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          title="Choose Theme: Light, Dark, or System"
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          className="p-1 pr-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md focus:outline-none"
        >
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 ${
              dropdownOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* Theme Selection Dropdown Menu */}
      {dropdownOpen && (
        <div
          role="listbox"
          aria-label="Select theme"
          className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-900/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800/80 mb-1">
            Appearance
          </div>

          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  setTheme(opt.id);
                  setDropdownOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  isSelected
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-3.5 h-3.5 ${opt.iconColor}`} />
                  <span>{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
