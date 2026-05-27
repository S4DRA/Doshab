"use client";

import { useState } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

export function PushNotificationToggle() {
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  async function enablePush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("error");
      return;
    }

    setStatus("saving");

    try {
      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        setStatus("error");
        return;
      }

      const publicKeyResponse = await fetch("/api/push/public-key", {
        headers: {
          accept: "application/json",
        },
      });
      const { publicKey } = (await publicKeyResponse.json()) as {
        publicKey?: string;
      };

      if (!publicKey) {
        setStatus("error");
        return;
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

      setStatus(response.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      className="mt-3 w-full rounded-xl border border-white/20 px-3 py-2 text-left text-xs font-semibold text-white transition hover:border-[#FF5F25] hover:text-[#FF5F25]"
      onClick={enablePush}
      type="button"
    >
      {status === "saving"
        ? "Enabling phone alerts..."
        : status === "done"
          ? "Phone alerts enabled"
          : status === "error"
            ? "Phone alerts unavailable"
            : "Enable phone alerts"}
    </button>
  );
}
