"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_DOSHAB_PALETTE_ID,
  DEFAULT_DOSHAB_THEME_ID,
  DEFAULT_DOSHAB_THEME_MODE,
  DOSHAB_MODE_STORAGE_KEY,
  DOSHAB_PALETTE_STORAGE_KEY,
  DOSHAB_THEME_STORAGE_KEY,
  getDoshabThemeId,
  getDoshabTheme,
  getValThemeAccent,
  resolveDoshabPaletteId,
  resolveDoshabThemeId,
  resolveDoshabThemeMode,
  type DoshabPaletteId,
  type DoshabThemeId,
  type DoshabThemeMode,
} from "@/lib/themes";

const themeChangeEventName = "doshab-theme-change";
const DARK_CHROME_COLOR = "#08090b";
const LIGHT_CHROME_COLOR = "#f6f3ea";

function setThemeChromeColor(mode: DoshabThemeMode) {
  const metaThemeColor = document.querySelector('meta[name="theme-color"]');

  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", mode === "light" ? LIGHT_CHROME_COLOR : DARK_CHROME_COLOR);
  }
}

function setDocumentTheme(themeId: DoshabThemeId) {
  const [paletteId, mode] = splitThemeId(themeId);

  document.documentElement.dataset.theme = themeId;
  document.documentElement.dataset.palette = paletteId;
  document.documentElement.dataset.mode = mode;
  const colors = getValThemeAccent(themeId);
  const theme = getDoshabTheme(themeId);
  document.documentElement.style.setProperty("--val-palette-accent", colors.accent);
  document.documentElement.style.setProperty("--val-palette-text", colors.text);
  document.documentElement.style.setProperty("--val-palette-canvas", theme.paletteId === "signal-orange" && mode === "dark" ? "#090c0d" : theme.colors.background);
  document.documentElement.style.setProperty("--val-palette-sidebar", theme.colors.surface);
  document.documentElement.style.setProperty("--val-palette-nav-text", theme.colors.text);
  document.documentElement.style.setProperty("--val-palette-nav-muted", theme.colors.muted);
  setThemeChromeColor(mode);
}

function splitThemeId(themeId: DoshabThemeId): [DoshabPaletteId, DoshabThemeMode] {
  const mode = themeId.endsWith("-light") ? "light" : "dark";
  const paletteId = resolveDoshabPaletteId(themeId.replace(/-(dark|light)$/, ""));

  return [paletteId, mode];
}

function storeTheme(themeId: DoshabThemeId) {
  const [paletteId, mode] = splitThemeId(themeId);

  window.localStorage.setItem(DOSHAB_THEME_STORAGE_KEY, themeId);
  window.localStorage.setItem(DOSHAB_PALETTE_STORAGE_KEY, paletteId);
  window.localStorage.setItem(DOSHAB_MODE_STORAGE_KEY, mode);
}

function applyTheme(themeId: DoshabThemeId) {
  setDocumentTheme(themeId);
  let error: string | null = null;
  try { storeTheme(themeId); }
  catch { error = "Theme applies for this visit. This browser could not save it."; }
  window.dispatchEvent(
    new CustomEvent(themeChangeEventName, {
      detail: {
        themeId,
      },
    }),
  );
  return error;
}

function getStoredTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_DOSHAB_THEME_ID;
  }

  let storedTheme: string | null;
  let storedPalette: string | null;
  let storedMode: string | null;
  try {
    storedTheme = window.localStorage.getItem(DOSHAB_THEME_STORAGE_KEY);
    storedPalette = window.localStorage.getItem(DOSHAB_PALETTE_STORAGE_KEY);
    storedMode = window.localStorage.getItem(DOSHAB_MODE_STORAGE_KEY);
  } catch { return resolveDoshabThemeId(document.documentElement.dataset.theme); }
  const resolvedLegacyTheme = resolveDoshabThemeId(storedTheme);
  const legacyTheme = storedTheme ? splitThemeId(resolvedLegacyTheme) : null;
  const paletteId = resolveDoshabPaletteId(storedPalette ?? legacyTheme?.[0] ?? DEFAULT_DOSHAB_PALETTE_ID);
  const mode = resolveDoshabThemeMode(storedMode ?? legacyTheme?.[1] ?? DEFAULT_DOSHAB_THEME_MODE);
  const resolvedTheme = getDoshabThemeId(paletteId, mode);

  return resolvedTheme;
}

export function useDoshabTheme() {
  const [themeId, setThemeIdState] = useState<DoshabThemeId>(DEFAULT_DOSHAB_THEME_ID);
  const [error, setError] = useState<string | null>(null);
  const [paletteId, mode] = splitThemeId(themeId);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedTheme = getStoredTheme();
      setDocumentTheme(storedTheme);
      setThemeIdState(storedTheme);
    });

    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === DOSHAB_THEME_STORAGE_KEY ||
        event.key === DOSHAB_PALETTE_STORAGE_KEY ||
        event.key === DOSHAB_MODE_STORAGE_KEY
      ) {
        const nextThemeId = getStoredTheme();
        setDocumentTheme(nextThemeId);
        setThemeIdState(nextThemeId);
      }
    };

    const handleThemeChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ themeId?: string }>;
      const nextThemeId = resolveDoshabThemeId(customEvent.detail?.themeId);
      setDocumentTheme(nextThemeId);
      setThemeIdState(nextThemeId);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener(themeChangeEventName, handleThemeChange);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(themeChangeEventName, handleThemeChange);
    };
  }, []);

  const setThemeId = (nextThemeId: DoshabThemeId) => {
    setThemeIdState(nextThemeId);
    setError(applyTheme(nextThemeId));
  };

  const setPaletteId = (nextPaletteId: DoshabPaletteId) => {
    setThemeId(getDoshabThemeId(nextPaletteId, mode));
  };

  const setMode = (nextMode: DoshabThemeMode) => {
    setThemeId(getDoshabThemeId(paletteId, nextMode));
  };

  return {
    error,
    mode,
    paletteId,
    setMode,
    setPaletteId,
    setThemeId,
    themeId,
  };
}
