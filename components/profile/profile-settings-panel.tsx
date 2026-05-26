"use client";

import { useEffect, useState } from "react";

export function ProfileSettingsPanel() {
  const [settings, setSettings] = useState({
    enableNotifications: false,
    shareOnlineStatus: true,
    autoTheme: "system",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("doshabProfileSettings") : null;
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch {
        // ignore invalid storage value
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("doshabProfileSettings", JSON.stringify(settings));
    }
  }, [settings]);

  const updateSetting = (key: keyof typeof settings, value: boolean | string) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Preferences
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">Settings panel</h2>
        </div>
        <p className="text-sm text-slate-500">Saved locally for a faster experience.</p>
      </div>

      <div className="grid gap-4">
        <label className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1020] px-4 py-4">
          <span>
            <span className="block text-sm font-semibold text-white">Enable notifications</span>
            <span className="block text-sm text-slate-400">Hear alerts for new messages and invites.</span>
          </span>
          <input
            aria-label="Enable notifications"
            checked={settings.enableNotifications}
            className="h-5 w-5 rounded border border-white/10 bg-[#0d1322] text-[#FF5F25]"
            onChange={(event) => updateSetting("enableNotifications", event.target.checked)}
            type="checkbox"
          />
        </label>

        <label className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0b1020] px-4 py-4">
          <span>
            <span className="block text-sm font-semibold text-white">Share online status</span>
            <span className="block text-sm text-slate-400">Allow friends to see when you are active.</span>
          </span>
          <input
            aria-label="Share online status"
            checked={settings.shareOnlineStatus}
            className="h-5 w-5 rounded border border-white/10 bg-[#0d1322] text-[#FF5F25]"
            onChange={(event) => updateSetting("shareOnlineStatus", event.target.checked)}
            type="checkbox"
          />
        </label>

        <label className="rounded-lg border border-white/10 bg-[#0b1020] px-4 py-4">
          <span className="block text-sm font-semibold text-white">Theme preference</span>
            <select
              className="mt-3 w-full rounded-md border border-white/10 bg-[#090d18] px-3 py-2 text-sm text-white outline-none transition focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20"
            value={settings.autoTheme}
            onChange={(event) => updateSetting("autoTheme", event.target.value)}
          >
            <option value="system">System default</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>

        <div className="rounded-lg border border-white/10 bg-[#0b1020] p-4 text-sm text-slate-400">
          <p>
            These controls are designed to make your workspace feel more personal. The theme preference and notification choices are stored locally for faster access.
          </p>
          {saved ? (
            <p className="mt-3 text-sm text-emerald-300">Settings saved.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
