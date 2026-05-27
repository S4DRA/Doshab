"use client";
import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  getPushRegistrationMessage,
  registerPushNotifications,
  type PushRegistrationResult,
} from "@/lib/browser-push";

type ProfileSettings = {
  enableNotifications: boolean;
  shareOnlineStatus: boolean;
};

const defaultSettings: ProfileSettings = {
  enableNotifications: false,
  shareOnlineStatus: true,
};

export function ProfileSettingsPanel() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<
    "idle" | "saving" | "enabled" | "error"
  >("idle");
  const [notificationMessage, setNotificationMessage] = useState("");
  const loadedSettingsRef = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const stored = window.localStorage.getItem("doshabProfileSettings");

      if (stored) {
        try {
          const parsedSettings = JSON.parse(stored) as Partial<ProfileSettings>;
          setSettings({
            ...defaultSettings,
            ...parsedSettings,
          });
        } catch {
          window.localStorage.removeItem("doshabProfileSettings");
        }
      }

      loadedSettingsRef.current = true;
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (loadedSettingsRef.current) {
      window.localStorage.setItem(
        "doshabProfileSettings",
        JSON.stringify(settings),
      );
    }
  }, [settings]);
  

  const flashSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1200);
  };

  const updateSetting = <SettingKey extends keyof ProfileSettings>(
    key: SettingKey,
    value: ProfileSettings[SettingKey],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    flashSaved();
  };

  const updateNotifications = async (enabled: boolean) => {
    if (!enabled) {
      updateSetting("enableNotifications", false);
      setNotificationMessage("");
      setNotificationStatus("idle");
      return;
    }

    setNotificationStatus("saving");

    try {
      const result = await registerPushNotifications();

      if (result.ok) {
        updateSetting("enableNotifications", true);
        setNotificationMessage(getPushRegistrationMessage(result));
        setNotificationStatus("enabled");
        return;
      }

      setSettings((current) => ({
        ...current,
        enableNotifications: false,
      }));
      setNotificationMessage(getPushRegistrationMessage(result));
    } catch {
      setSettings((current) => ({
        ...current,
        enableNotifications: false,
      }));
      setNotificationMessage(
        getPushRegistrationMessage({
          ok: false,
          reason: "subscription-failed",
        } satisfies PushRegistrationResult),
      );
    }

    setNotificationStatus("error");
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
            onChange={(event) => void updateNotifications(event.target.checked)}
            type="checkbox"
          />
        </label>
        {notificationStatus === "saving" ? (
          <p className="-mt-2 px-4 text-xs text-slate-400">Enabling phone alerts...</p>
        ) : null}
        {notificationStatus === "enabled" ? (
          <p className="-mt-2 px-4 text-xs text-emerald-300">{notificationMessage}</p>
        ) : null}
        {notificationStatus === "error" ? (
          <p className="-mt-2 px-4 text-xs text-amber-300">{notificationMessage}</p>
        ) : null}

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
         
        <form action="/api/auth/logout" method="post">
          <button
            className="h-11 w-full rounded-lg border border-white/10 bg-white px-4 text-sm font-bold text-black transition hover:bg-[#FF5F25]"
            type="submit"
          >
            Log out
          </button>
        </form>
 {saved ? (
            <p className="mt-3 text-sm text-emerald-300">Settings saved.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
