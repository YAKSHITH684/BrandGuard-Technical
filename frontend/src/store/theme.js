import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const ThemeContext = createContext({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: false,
});

const STORAGE_KEY = "brandguard_theme";

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState("system");
  const [resolvedTheme, setResolvedTheme] = useState("light");
  const [mounted, setMounted] = useState(false);

  // Helper to determine the system theme
  const getSystemTheme = useCallback(() => {
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, []);

  // Update DOM classes and styles
  const applyTheme = useCallback((targetTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (targetTheme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      root.setAttribute("data-theme", "light");
    }
  }, []);

  // Set theme and save to localStorage
  const setTheme = useCallback(
    (newTheme) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(STORAGE_KEY, newTheme);
      } catch (e) {
        console.warn("Unable to save theme preference:", e);
      }

      const active = newTheme === "system" ? getSystemTheme() : newTheme;
      setResolvedTheme(active);
      applyTheme(active);
    },
    [getSystemTheme, applyTheme]
  );

  // Quick toggle between light and dark
  const toggleTheme = useCallback(() => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  // Initial load from localStorage and system preference
  useEffect(() => {
    let savedTheme = "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        savedTheme = stored;
      }
    } catch (e) {
      console.warn("Unable to read theme preference:", e);
    }

    setThemeState(savedTheme);
    const active = savedTheme === "system" ? getSystemTheme() : savedTheme;
    setResolvedTheme(active);
    applyTheme(active);
    setMounted(true);

    // Watch OS color-scheme changes
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e) => {
      try {
        const currentStored = localStorage.getItem(STORAGE_KEY) || "system";
        if (currentStored === "system") {
          const sys = e.matches ? "dark" : "light";
          setResolvedTheme(sys);
          applyTheme(sys);
        }
      } catch (err) {}
    };

    mediaQuery.addEventListener("change", handleSystemChange);

    // Watch for cross-tab storage changes
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY) {
        const val = e.newValue || "system";
        setThemeState(val);
        const activeTheme = val === "system" ? getSystemTheme() : val;
        setResolvedTheme(activeTheme);
        applyTheme(activeTheme);
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [getSystemTheme, applyTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        isDark: resolvedTheme === "dark",
        setTheme,
        toggleTheme,
        mounted,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
