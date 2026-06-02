"use client";

import { useEffect, useState } from "react";

import {
  DEFAULT_DOSHAB_THEME_ID,
  DOSHAB_THEME_STORAGE_KEY,
  resolveDoshabThemeId,
  type DoshabThemeId,
} from "@/lib/themes";

const themeChangeEventName = "doshab-theme-change";

function setDocumentTheme(themeId: DoshabThemeId) {
  document.documentElement.dataset.theme = themeId;
}

function applyTheme(themeId: DoshabThemeId) {
  setDocumentTheme(themeId);
  window.localStorage.setItem(DOSHAB_THEME_STORAGE_KEY, themeId);
  window.dispatchEvent(
    new CustomEvent(themeChangeEventName, {
      detail: {
        themeId,
      },
    }),
  );
}

function getStoredTheme() {
  if (typeof window === "undefined") {
    return DEFAULT_DOSHAB_THEME_ID;
  }

  return resolveDoshabThemeId(window.localStorage.getItem(DOSHAB_THEME_STORAGE_KEY));
}

export function useDoshabTheme() {
  const [themeId, setThemeIdState] = useState<DoshabThemeId>(DEFAULT_DOSHAB_THEME_ID);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const storedTheme = getStoredTheme();
      setDocumentTheme(storedTheme);
      setThemeIdState(storedTheme);
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === DOSHAB_THEME_STORAGE_KEY) {
        const nextThemeId = resolveDoshabThemeId(event.newValue);
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
    applyTheme(nextThemeId);
  };

  return {
    setThemeId,
    themeId,
  };
}
