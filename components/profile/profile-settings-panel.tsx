"use client";

import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";

type ProfileSettings = {
  enableNotifications: boolean;
  shareOnlineStatus: boolean;
};

const defaultSettings: ProfileSettings = {
  enableNotifications: false,
  shareOnlineStatus: true,
};

function getInitialSettings(): ProfileSettings {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const stored = window.localStorage.getItem("doshabProfileSettings");

  if (!stored) {
    return defaultSettings;
  }

  try {
    const parsedSettings = JSON.parse(stored) as Partial<ProfileSettings>;

    return {
      ...defaultSettings,
      ...parsedSettings,
    };
  } catch {
    return defaultSettings;
  }
}

export function ProfileSettingsPanel() {
  const [settings, setSettings] = useState(getInitialSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("doshabProfileSettings", JSON.stringify(settings));
    }
  }, [settings]);

  const updateSetting = <SettingKey extends keyof ProfileSettings>(
    key: SettingKey,
    value: ProfileSettings[SettingKey],
  ) => {
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

        <div className="flex items-center justify-between gap-4 rounded-lg border border-white/10 bg-[#0b1020] px-4 py-4">
          <span>
            <span className="block text-sm font-semibold text-white">Theme</span>
            <span className="block text-sm text-slate-400">
              Switch between high-contrast dark and light mode.
            </span>
          </span>
          <ThemeToggle />
        </div>

        <div className="rounded-lg border border-white/10 bg-[#0b1020] p-4 text-sm text-slate-400">
          <p>
            These controls are designed to make your workspace feel more personal. The theme preference and notification choices are stored locally for faster access.
          </p>
          {saved ? (
            <p className="mt-3 text-sm text-emerald-300">Settings saved.</p>
          ) : null}
        </div>

        <form action="/api/auth/logout" method="post">
          <button
            className="h-11 w-full rounded-lg border border-white/10 bg-white px-4 text-sm font-bold text-black transition hover:bg-[#FF5F25]"
            type="submit"
          >
            Log out
          </button>
        </form>
      </div>
    </section>
  );
}
