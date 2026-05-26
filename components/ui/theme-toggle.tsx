"use client";

import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

function getInitialTheme(): ThemeMode {
  if (typeof document === "undefined") {
    return "dark";
  }

  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("doshab-theme", theme);
  }, [theme]);

  return (
    <button
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className="theme-toggle inline-flex h-8 items-center justify-center rounded-full border text-[11px] font-semibold transition"
      onClick={() => {
        setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"));
      }}
      type="button"
    >
      <span className="theme-toggle-option" data-active={theme === "dark"}>
        Dark
      </span>
      <span className="theme-toggle-option" data-active={theme === "light"}>
        Light
      </span>
    </button>
  );
}
