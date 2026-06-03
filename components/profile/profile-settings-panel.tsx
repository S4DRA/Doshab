"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  getPushRegistrationMessage,
  registerPushNotifications,
  type PushRegistrationResult,
} from "@/lib/browser-push";

type ProfileSettings = {
  callNotifications: boolean;
  enableNotifications: boolean;
  friendInviteNotifications: boolean;
  messageNotifications: boolean;
  shareOnlineStatus: boolean;
  showMessagePreview: boolean;
  soundEnabled: boolean;
};

const defaultSettings: ProfileSettings = {
  callNotifications: true,
  enableNotifications: false,
  friendInviteNotifications: true,
  messageNotifications: true,
  shareOnlineStatus: true,
  showMessagePreview: true,
  soundEnabled: true,
};

export function ProfileSettingsPanel() {
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState<
    "idle" | "saving" | "enabled" | "testing" | "tested" | "error"
  >("idle");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [permissionStatus, setPermissionStatus] = useState("Not enabled");
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
      setPermissionStatus(getBrowserPermissionStatus());
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
        setPermissionStatus(getBrowserPermissionStatus());
        return;
      }

      setSettings((current) => ({
        ...current,
        enableNotifications: false,
      }));
      setNotificationMessage(getPushRegistrationMessage(result));
      setPermissionStatus(getBrowserPermissionStatus());
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
      setPermissionStatus(getBrowserPermissionStatus());
    }

    setNotificationStatus("error");
  };

  const sendTestNotification = async () => {
    setNotificationStatus("testing");

    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Test notification failed.");
      }

      setNotificationMessage("Test notification sent.");
      setNotificationStatus("tested");
    } catch {
      setNotificationMessage("Could not send a test notification on this device.");
      setNotificationStatus("error");
    }
  };

  return (
    <section className="app-panel p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Preferences
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">Settings panel</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Control your local experience, alerts, and account access.
          </p>
        </div>
        <span className="app-badge w-fit px-3 py-1 text-xs font-semibold">
          Local preferences
        </span>
      </div>

      <div className="grid gap-3">
        <div className="app-row p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">Notifications</span>
              <span className="block text-sm leading-5 text-slate-400">
                Enable notifications so you do not miss messages, invites, or incoming calls.
              </span>
              <span className="mt-2 inline-flex rounded-md border border-white/10 bg-white/7 px-2 py-1 text-xs text-slate-300">
                Browser permission: {permissionStatus}
              </span>
            </span>
            <label className="flex shrink-0 items-center gap-3">
              <span className="text-sm font-semibold text-white">Enable</span>
              <input
                aria-label="Enable browser notifications"
                checked={settings.enableNotifications}
                className="app-switch"
                onChange={(event) => void updateNotifications(event.target.checked)}
                type="checkbox"
              />
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <NotificationToggle
              checked={settings.messageNotifications}
              description="Alerts for direct messages and channel notifications."
              label="Message notifications"
              onChange={(checked) => updateSetting("messageNotifications", checked)}
            />
            <NotificationToggle
              checked={settings.callNotifications}
              description="Incoming and missed call alerts."
              label="Call notifications"
              onChange={(checked) => updateSetting("callNotifications", checked)}
            />
            <NotificationToggle
              checked={settings.friendInviteNotifications}
              description="Friend requests and space invites."
              label="Friend/invite notifications"
              onChange={(checked) => updateSetting("friendInviteNotifications", checked)}
            />
            <NotificationToggle
              checked={settings.soundEnabled}
              description="Short sound for incoming calls when allowed."
              label="Sound"
              onChange={(checked) => updateSetting("soundEnabled", checked)}
            />
            <NotificationToggle
              checked={settings.showMessagePreview}
              description="Show message previews in local alerts."
              label="Message previews"
              onChange={(checked) => updateSetting("showMessagePreview", checked)}
            />
            <button
              className="app-button-secondary min-h-12 rounded-lg px-4 text-sm font-semibold transition"
              disabled={!settings.enableNotifications || notificationStatus === "testing"}
              onClick={sendTestNotification}
              type="button"
            >
              {notificationStatus === "testing" ? "Sending test..." : "Test notification"}
            </button>
          </div>
        </div>
        {notificationStatus === "saving" ? (
          <p className="-mt-1 px-4 text-xs text-slate-400">Opening browser permission prompt...</p>
        ) : null}
        {notificationStatus === "enabled" || notificationStatus === "tested" ? (
          <p className="-mt-1 px-4 text-xs text-emerald-300">{notificationMessage}</p>
        ) : null}
        {notificationStatus === "error" ? (
          <p className="-mt-1 rounded-lg border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-xs leading-5 text-amber-300">
            {notificationMessage}
          </p>
        ) : null}

        <label className="app-row flex items-center justify-between gap-4 px-4 py-4">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">Share online status</span>
            <span className="block text-sm leading-5 text-slate-400">
              Allow friends to see when you are active.
            </span>
          </span>
          <input
            aria-label="Share online status"
            checked={settings.shareOnlineStatus}
            className="app-switch"
            onChange={(event) => updateSetting("shareOnlineStatus", event.target.checked)}
            type="checkbox"
          />
        </label>

        <div className="app-row flex flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">Themes</span>
            <span className="block text-sm leading-5 text-slate-400">
              Open the full theme gallery and choose a global Doshab style.
            </span>
          </span>
          <Link
            className="app-button-primary inline-flex h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-bold transition sm:h-10"
            href="/dashboard/profile/themes"
          >
            Theme settings
          </Link>
        </div>

        <div className="app-row p-4 text-sm text-slate-400">
          <div className="grid gap-5">
            <div>
              <p className="text-sm font-semibold text-white">Account</p>
              <p className="mt-1 text-sm leading-5 text-slate-400">
                Change your password or end this session on the current device.
              </p>
            </div>
            <form action="/api/auth/update-password" className="grid gap-3" method="post">
              <input name="returnTo" type="hidden" value="profile" />
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  New password
                </span>
                <input
                  autoComplete="new-password"
                  className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
                  minLength={8}
                  name="password"
                  required
                  type="password"
                />
              </label>
              <label className="block">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                  Confirm password
                </span>
                <input
                  autoComplete="new-password"
                  className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
                  minLength={8}
                  name="confirmPassword"
                  required
                  type="password"
                />
              </label>
              <button
                className="app-button-primary h-12 w-full rounded-lg px-4 text-sm font-bold transition sm:h-11 sm:w-auto"
                type="submit"
              >
                Change password
              </button>
            </form>
            <form action="/api/auth/logout" method="post">
              <button
                className="app-button-secondary h-12 w-full rounded-lg px-4 text-sm font-bold transition sm:h-11 sm:w-auto"
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>
          {saved ? (
            <p className="mt-3 text-sm text-emerald-300">Settings saved.</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function NotificationToggle({
  checked,
  description,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <span className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-white">{label}</span>
        <input
          aria-label={label}
          checked={checked}
          className="app-switch"
          onChange={(event) => onChange(event.target.checked)}
          type="checkbox"
        />
      </span>
      <span className="mt-2 block text-xs leading-5 text-slate-400">
        {description}
      </span>
    </label>
  );
}

function getBrowserPermissionStatus() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "Not supported";
  }

  switch (Notification.permission) {
    case "granted":
      return "Allowed";
    case "denied":
      return "Blocked";
    default:
      return "Not enabled";
  }
}
