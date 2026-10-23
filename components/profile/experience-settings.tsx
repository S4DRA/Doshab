"use client";
import { useState } from "react";
import { useExperience } from "@/components/layout/experience-provider";

export function ExperienceSettings() {
  const experience = useExperience();
  const [diagnostics, setDiagnostics] = useState("");
  if (!experience) return null;
  const { preferences, updatePreferences, storageError } = experience;
  return <section className="app-card grid gap-4 p-4" aria-label="Comfort and performance">
    <h3 className="font-semibold">Comfort and performance</h3>
    <label className="flex items-center justify-between gap-4"><span>Game-Safe Mode<small className="block text-sm opacity-75">Pause decorative effects and navigation preparation. Calls and alerts stay active.</small></span><input className="app-switch" type="checkbox" checked={preferences.gameSafe} onChange={(event) => updatePreferences({ ...preferences, gameSafe: event.target.checked })} /></label>
    <label className="flex items-center justify-between gap-4"><span>Reduce motion<small className="block text-sm opacity-75">Your device’s motion preference is always respected.</small></span><input className="app-switch" type="checkbox" checked={preferences.reducedMotion} onChange={(event) => updatePreferences({ ...preferences, reducedMotion: event.target.checked })} /></label>
    <label className="flex items-center justify-between gap-4">Density<select value={preferences.density} onChange={(event) => updatePreferences({ ...preferences, density: event.target.value === "compact" ? "compact" : "comfortable" })}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
    {storageError && <p role="status">{storageError}</p>}
    <details><summary>Navigation diagnostics</summary><button className="app-button-secondary mt-3 px-3 py-2" type="button" onClick={() => setDiagnostics(JSON.stringify(experience.diagnostics(), null, 2))}>Refresh local measurements</button><p className="mt-2 text-sm">Counts and route commit timings from this session. No message content or route names are collected.</p>{diagnostics && <pre className="mt-2 overflow-auto text-xs" aria-live="polite">{diagnostics}</pre>}</details>
  </section>;
}
