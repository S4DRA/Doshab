"use client";

import { useEffect, useRef, useState } from "react";

type ThemeMode = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const loadedThemeRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedTheme =
        window.localStorage.getItem("doshab-theme") === "light" ? "light" : "dark";

      setTheme(storedTheme);
      loadedThemeRef.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (loadedThemeRef.current) {
      document.documentElement.dataset.theme = theme;
      window.localStorage.setItem("doshab-theme", theme);
    }
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
