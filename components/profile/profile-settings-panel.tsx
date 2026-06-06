"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  getBrowserPushDiagnostics,
  getPushRegistrationMessage,
  registerPushNotifications,
  type BrowserPushDiagnostics,
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
  const [pushDiagnostics, setPushDiagnostics] = useState<BrowserPushDiagnostics | null>(null);
  const [showPhoneSteps, setShowPhoneSteps] = useState(false);
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
      void refreshPushDiagnostics();
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
        setSettings((current) => ({
          ...current,
          callNotifications: true,
          enableNotifications: true,
          friendInviteNotifications: true,
          messageNotifications: true,
        }));
        window.localStorage.setItem("doshabNotificationOnboardingCompleted", "true");
        setNotificationMessage(getPushRegistrationMessage(result));
        setNotificationStatus("enabled");
        setPermissionStatus(getBrowserPermissionStatus());
        void refreshPushDiagnostics();
        return;
      }

      setSettings((current) => ({
        ...current,
        enableNotifications: false,
      }));
      setNotificationMessage(getPushRegistrationMessage(result));
      setPermissionStatus(getBrowserPermissionStatus());
      void refreshPushDiagnostics();
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
      void refreshPushDiagnostics();
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
      void refreshPushDiagnostics();
    } catch {
      setNotificationMessage("Could not send a test notification on this device.");
      setNotificationStatus("error");
    }
  };

  async function refreshPushDiagnostics() {
    const diagnostics = await getBrowserPushDiagnostics();
    setPushDiagnostics(diagnostics);
    setPermissionStatus(formatPermissionStatus(diagnostics.notificationPermission));

    if (diagnostics.status === "enabled") {
      window.localStorage.setItem("doshabNotificationOnboardingCompleted", "true");
    }
  }

  const restartPlatformTour = () => {
    const isMobile = window.innerWidth < 768;
    const variantCompletedKey = isMobile
      ? "doshabTourVariantCompletedMobile"
      : "doshabTourVariantCompletedDesktop";
    const variantStepKey = isMobile ? "doshabTourStepMobile" : "doshabTourStepDesktop";

    window.localStorage.removeItem("doshabTourCompleted");
    window.localStorage.removeItem(variantCompletedKey);
    window.localStorage.removeItem("doshabTourSkippedAt");
    window.localStorage.setItem("doshabTourStep", "0");
    window.localStorage.setItem(variantStepKey, "0");
    window.dispatchEvent(new Event("doshab:restart-platform-tour"));
    setNotificationMessage("Platform tour restarted.");
    setNotificationStatus("tested");
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
        <div className="app-row p-4" data-tour-target="notifications-settings">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-white">Notifications</span>
              <span className="block text-sm leading-5 text-slate-400">
                Enable notifications so you do not miss messages, invites, or incoming calls.
              </span>
              <span className="mt-2 block max-w-2xl text-xs leading-5 text-slate-500">
                Call notifications appear as phone notifications when VAL is installed and notification permission is enabled. Some phones/browsers may not support full-screen call screens from a PWA.
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
          <div className="mt-4 grid gap-2 rounded-lg border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-2">
            <StatusLine label="Browser permission" value={permissionStatus} />
            <StatusLine
              label="Push subscription"
              value={formatDiagnosticsValue(pushDiagnostics?.pushSubscription)}
            />
            <StatusLine
              label="Service worker"
              value={formatDiagnosticsValue(pushDiagnostics?.serviceWorker)}
            />
            <StatusLine
              label="Installed PWA mode"
              value={formatDiagnosticsValue(pushDiagnostics?.installedPwa)}
            />
            <StatusLine label="Message notifications" value={settings.messageNotifications ? "On" : "Off"} />
            <StatusLine label="Call notifications" value={settings.callNotifications ? "On" : "Off"} />
            <StatusLine label="Invite notifications" value={settings.friendInviteNotifications ? "On" : "Off"} />
            <StatusLine label="Sound" value={settings.soundEnabled ? "On" : "Off"} />
            <StatusLine label="Message previews" value={settings.showMessagePreview ? "On" : "Off"} />
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
            <button
              className="app-button-secondary min-h-12 rounded-lg px-4 text-sm font-semibold transition"
              onClick={() => void refreshPushDiagnostics()}
              type="button"
            >
              Refresh status
            </button>
            <button
              className="min-h-12 rounded-lg border border-white/15 px-4 text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25]/60 hover:text-white"
              onClick={() => setShowPhoneSteps((current) => !current)}
              type="button"
            >
              {pushDiagnostics?.status === "blocked" ? "Fix blocked notifications" : "Show phone setup steps"}
            </button>
          </div>
          {showPhoneSteps || pushDiagnostics?.status === "blocked" ? (
            <NotificationSetupGuide installedPwa={pushDiagnostics?.installedPwa === "yes"} />
          ) : null}
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

        <div className="settings-shortcut-row app-row flex flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between" data-tour-target="themes-settings">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">Themes</span>
            <span className="block text-sm leading-5 text-slate-400">
              Open the full theme gallery and choose a global VAL style.
            </span>
          </span>
          <Link
            className="settings-shortcut-button app-button-primary inline-flex h-11 shrink-0 items-center justify-center rounded-lg px-4 text-sm font-bold transition sm:h-10"
            href="/dashboard/profile/themes"
          >
            Theme settings
          </Link>
        </div>

        <div className="app-row flex flex-col items-stretch gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="min-w-0">
            <span className="block text-sm font-semibold text-white">Platform tour</span>
            <span className="block text-sm leading-5 text-slate-400">
              Replay the guided VAL tour from the beginning.
            </span>
          </span>
          <button
            className="app-button-secondary h-12 shrink-0 rounded-lg px-4 text-sm font-bold transition sm:h-11"
            onClick={restartPlatformTour}
            type="button"
          >
            Restart platform tour
          </button>
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

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </span>
  );
}

function NotificationSetupGuide({ installedPwa }: { installedPwa: boolean }) {
  const isIos =
    typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent);
  const steps = isIos
    ? [
        "Open Settings.",
        "Tap Notifications.",
        "Find VAL if it is installed.",
        "Allow Notifications.",
        "Enable Lock Screen, Notification Center, and Banners.",
      ]
    : installedPwa
      ? [
          "Long press the VAL app icon.",
          "Tap App info.",
          "Tap Notifications.",
          "Turn on notifications.",
          "Enable Pop-up, Floating, Banner, or Lock screen notifications if available.",
          "Enable Lock screen notifications if desired.",
        ]
      : [
          "Open Chrome settings.",
          "Open Site settings.",
          "Tap Notifications.",
          "Find VAL.",
          "Allow notifications.",
        ];

  return (
    <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
      <p className="text-sm font-semibold text-white">Phone notification setup</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">
        Browsers and PWAs cannot reliably open every phone&apos;s floating notification settings page. Use these steps if banners, pop-ups, or lock screen alerts are missing.
      </p>
      <ol className="mt-3 grid gap-2 text-sm leading-5 text-slate-300">
        {steps.map((step, index) => (
          <li className="flex gap-2" key={step}>
            <span className="text-[#FFB199]">{index + 1}.</span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
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

function formatPermissionStatus(
  permission: BrowserPushDiagnostics["notificationPermission"],
) {
  switch (permission) {
    case "granted":
      return "Allowed";
    case "denied":
      return "Blocked";
    case "default":
      return "Not enabled";
    default:
      return "Unsupported";
  }
}

function formatDiagnosticsValue(value?: string) {
  switch (value) {
    case "active":
      return "Active";
    case "denied":
      return "Blocked";
    case "granted":
      return "Allowed";
    case "missing":
      return "Missing";
    case "no":
      return "No";
    case "unsupported":
      return "Unsupported";
    case "yes":
      return "Yes";
    default:
      return "Unknown";
  }
}
