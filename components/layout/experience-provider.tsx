"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import { createConversationPositions, createNavigationPreparation, preparationAllowed } from "@/lib/adaptive-navigation";

type Connection = { saveData?: boolean; effectiveType?: string };
type Preferences = { gameSafe: boolean; reducedMotion: boolean; density: "comfortable" | "compact" };
const defaults: Preferences = { gameSafe: false, reducedMotion: false, density: "comfortable" };
const ExperienceContext = createContext<ReturnType<typeof useExperienceState> | null>(null);
function useExperienceState(userId: string) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const key = `val:experience:${userId}`;
  const [preferences, setPreferences] = useState(defaults);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [positions] = useState(() => createConversationPositions());
  const navigation = useRef<{ start: number; href: string } | null>(null);
  const measurements = useRef<number[]>([]);
  const mainThread = useRef({ longTasks: 0, blockingMs: 0, cls: 0 });
  const [preparation] = useState(() => createNavigationPreparation({
    prefetch: (href, options) => router.prefetch(href, { ...options, kind: PrefetchKind.AUTO }),
    current: () => `${location.pathname}${location.search}`,
    allowed: () => {
      const connection = (navigator as Navigator & { connection?: Connection }).connection;
      return preparationAllowed({ hidden: document.hidden, online: navigator.onLine, gameSafe: document.documentElement.dataset.valGameSafe === "true", mediaActive: document.documentElement.dataset.valMediaActive === "true", saveData: connection?.saveData, effectiveType: connection?.effectiveType });
    },
  }));
  useEffect(() => {
    if (typeof PerformanceObserver === "undefined") return;
    const supported = PerformanceObserver.supportedEntryTypes;
    const observers: PerformanceObserver[] = [];
    if (supported.includes("longtask")) {
      const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) { mainThread.current.longTasks++; mainThread.current.blockingMs += Math.max(0, entry.duration - 50); } });
      observer.observe({ type: "longtask", buffered: true }); observers.push(observer);
    }
    if (supported.includes("layout-shift")) {
      let sessionStart = 0, lastShift = -Infinity, sessionScore = 0;
      const observer = new PerformanceObserver((list) => { for (const entry of list.getEntries()) {
        const shift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (shift.hadRecentInput) continue;
        if (shift.startTime - lastShift > 1000 || shift.startTime - sessionStart > 5000) { sessionStart = shift.startTime; sessionScore = 0; }
        lastShift = shift.startTime; sessionScore += shift.value;
        mainThread.current.cls = Math.max(mainThread.current.cls, sessionScore);
      } });
      observer.observe({ type: "layout-shift", buffered: true }); observers.push(observer);
    }
    return () => observers.forEach((observer) => observer.disconnect());
  }, []);
  useEffect(() => {
    let live = true;
    const read = () => {
      try {
        const value = JSON.parse(localStorage.getItem(key) ?? "{}");
        if (live) setPreferences({ gameSafe: value?.gameSafe === true, reducedMotion: value?.reducedMotion === true, density: value?.density === "compact" ? "compact" : "comfortable" });
      } catch { if (live) setStorageError("Saved experience settings are unavailable. Defaults are active."); }
    };
    queueMicrotask(read);
    const changed = (event: StorageEvent) => { if (event.key === key) read(); };
    window.addEventListener("storage", changed);
    return () => { live = false; window.removeEventListener("storage", changed); positions.clear(); };
  }, [key, positions]);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.valGameSafe = String(preferences.gameSafe);
    root.dataset.valReducedMotion = String(preferences.reducedMotion);
    root.dataset.valDensity = preferences.density;
    preparation.cancel();
    return () => { delete root.dataset.valGameSafe; delete root.dataset.valReducedMotion; delete root.dataset.valDensity; };
  }, [preferences, preparation]);
  useEffect(() => {
    const cancel = () => preparation.cancel();
    const shortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k" || event.altKey || event.repeat) return;
      if ((event.target as HTMLElement | null)?.closest("input,textarea,select,[contenteditable='true']") || document.querySelector('[aria-modal="true"]')) return;
      event.preventDefault(); preparation.cancel(); router.push("/dashboard/search");
    };
    document.addEventListener("visibilitychange", cancel);
    window.addEventListener("offline", cancel);
    window.addEventListener("keydown", shortcut);
    return () => { cancel(); document.removeEventListener("visibilitychange", cancel); window.removeEventListener("offline", cancel); window.removeEventListener("keydown", shortcut); };
  }, [preparation, router]);
  useEffect(() => {
    const href = `${pathname}${params.size ? `?${params}` : ""}`;
    preparation.visit(href);
    if (navigation.current?.href === href) {
      const completedAt = performance.now();
      measurements.current.push(Math.round(completedAt - navigation.current.start));
      performance.clearMeasures("val:navigation-commit");
      performance.measure("val:navigation-commit", { start: navigation.current.start, end: completedAt });
      if (measurements.current.length > 100) measurements.current.shift();
    }
    navigation.current = null;
  }, [pathname, params, preparation]);
  const updatePreferences = (next: Preferences) => {
    setPreferences(next);
    try { localStorage.setItem(key, JSON.stringify(next)); setStorageError(null); }
    catch { setStorageError("These settings apply now, but could not be saved on this device."); }
  };
  return { preferences, updatePreferences, storageError, positions, preparation,
    beginNavigation: (href: string) => { preparation.cancel(); navigation.current = { href, start: performance.now() }; },
    diagnostics: () => ({ preparation: preparation.snapshot(), navigationCommitMs: [...measurements.current], mainThread: { ...mainThread.current } }),
  };
}
export function ExperienceProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const state = useExperienceState(userId);
  return <ExperienceContext.Provider value={state}>{children}</ExperienceContext.Provider>;
}
export function useExperience() { return useContext(ExperienceContext); }
