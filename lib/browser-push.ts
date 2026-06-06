"use client";

export type PushRegistrationResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "denied"
        | "insecure-context"
        | "missing-key"
        | "subscription-failed"
        | "unsupported";
    };

export type NotificationOnboardingStatus =
  | "blocked"
  | "enabled"
  | "not_enabled"
  | "unsupported";

export type BrowserPushDiagnostics = {
  installedPwa: "no" | "unknown" | "yes";
  notificationPermission: "default" | "denied" | "granted" | "unsupported";
  pushSubscription: "active" | "missing" | "unknown";
  serviceWorker: "active" | "missing" | "unsupported";
  status: NotificationOnboardingStatus;
  supportsPush: boolean;
  supportsServiceWorker: boolean;
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function canUsePushNotifications() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function isInstalledPwa() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    Boolean(window.navigator.standalone)
  );
}

export async function getBrowserPushDiagnostics(): Promise<BrowserPushDiagnostics> {
  const baseDiagnostics: BrowserPushDiagnostics = {
    installedPwa: typeof window === "undefined" ? "unknown" : isInstalledPwa() ? "yes" : "no",
    notificationPermission: "unsupported",
    pushSubscription: "unknown",
    serviceWorker: "unsupported",
    status: "unsupported",
    supportsPush: false,
    supportsServiceWorker: false,
  };

  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return baseDiagnostics;
  }

  const hasNotifications = "Notification" in window;
  const supportsServiceWorker = "serviceWorker" in navigator;
  const supportsPush = "PushManager" in window;
  const notificationPermission = hasNotifications
    ? Notification.permission
    : "unsupported";

  if (!window.isSecureContext || !hasNotifications || !supportsServiceWorker || !supportsPush) {
    return {
      ...baseDiagnostics,
      notificationPermission,
      serviceWorker: supportsServiceWorker ? "missing" : "unsupported",
      supportsPush,
      supportsServiceWorker,
    };
  }

  let serviceWorker: BrowserPushDiagnostics["serviceWorker"] = "missing";
  let pushSubscription: BrowserPushDiagnostics["pushSubscription"] = "missing";

  try {
    const registration =
      (await navigator.serviceWorker.getRegistration("/push-sw.js")) ??
      (await navigator.serviceWorker.getRegistration());

    serviceWorker = registration?.active ? "active" : "missing";

    if (registration) {
      const subscription = await registration.pushManager.getSubscription();
      pushSubscription = subscription ? "active" : "missing";
    }
  } catch {
    pushSubscription = "unknown";
  }

  const status: NotificationOnboardingStatus =
    notificationPermission === "denied"
      ? "blocked"
      : notificationPermission === "granted" && pushSubscription === "active"
        ? "enabled"
        : "not_enabled";

  return {
    installedPwa: isInstalledPwa() ? "yes" : "no",
    notificationPermission,
    pushSubscription,
    serviceWorker,
    status,
    supportsPush,
    supportsServiceWorker,
  };
}

export function getPushRegistrationMessage(result: PushRegistrationResult) {
  if (result.ok) {
    return "Phone alerts enabled.";
  }

  switch (result.reason) {
    case "denied":
      return "Notifications are blocked. Allow them in your browser settings, then try again.";
    case "insecure-context":
      return "Phone alerts need HTTPS, or localhost on the same device.";
    case "missing-key":
      return "Phone alerts are missing deployment push keys. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT to the app.";
    case "subscription-failed":
      return "Phone alerts could not be saved. Please sign in and try again.";
    case "unsupported":
      return "This browser does not support web push alerts here.";
    default:
      return "Phone alerts could not be enabled on this device.";
  }
}

export async function registerPushNotifications(): Promise<PushRegistrationResult> {
  if (typeof window !== "undefined" && !window.isSecureContext) {
    return { ok: false, reason: "insecure-context" };
  }

  if (!canUsePushNotifications()) {
    return { ok: false, reason: "unsupported" };
  }

  const permission = await Notification.requestPermission();

  if (permission !== "granted") {
    return { ok: false, reason: "denied" };
  }

  const publicKeyResponse = await fetch("/api/push/public-key", {
    headers: {
      accept: "application/json",
    },
  }).catch(() => null);
  const publicKeyResponseBody =
    publicKeyResponse?.ok
      ? ((await publicKeyResponse.json().catch(() => null)) as {
          publicKey?: string;
        } | null)
      : null;
  const publicKey =
    publicKeyResponseBody?.publicKey ??
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
    "";

  if (!publicKey) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "VAL push notifications are missing VAPID keys. Add NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT to enable Web Push.",
      );
    }

    return { ok: false, reason: "missing-key" };
  }

  const registration = await navigator.serviceWorker.register("/push-sw.js");
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription =
    existingSubscription ??
    (await registration.pushManager.subscribe({
      applicationServerKey: urlBase64ToUint8Array(publicKey),
      userVisibleOnly: true,
    }));

  const response = await fetch("/api/push/subscribe", {
    body: JSON.stringify(subscription.toJSON()),
    headers: {
      "content-type": "application/json",
    },
    method: "POST",
  });

  return response.ok ? { ok: true } : { ok: false, reason: "subscription-failed" };
}

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}
