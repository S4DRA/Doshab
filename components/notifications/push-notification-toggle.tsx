"use client";

import { useState } from "react";

import {
  getPushRegistrationMessage,
  registerPushNotifications,
  type PushRegistrationResult,
} from "@/lib/browser-push";

export function PushNotificationToggle() {
  const [status, setStatus] = useState<
    "idle" | "saving" | "done" | "testing" | "tested" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function enablePush() {
    setStatus("saving");

    try {
      const result = await registerPushNotifications();

      if (result.ok) {
        setErrorMessage("");
        setStatus("done");
        return;
      }

      setErrorMessage(getPushRegistrationMessage(result));
      setStatus("error");
    } catch {
      setErrorMessage(
        getPushRegistrationMessage({
          ok: false,
          reason: "subscription-failed",
        } satisfies PushRegistrationResult),
      );
      setStatus("error");
    }
  }

  async function sendTestPush() {
    setStatus("testing");

    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
      });

      setStatus(response.ok ? "tested" : "error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      <button
        className="w-full rounded-lg border border-white/20 px-3 py-2 text-left text-xs font-semibold text-white transition hover:border-[#FF5F25] hover:text-[#FF5F25]"
        onClick={enablePush}
        type="button"
      >
        {status === "saving"
          ? "Enabling phone alerts..."
          : status === "done" || status === "tested"
            ? "Phone alerts enabled"
            : status === "error"
              ? "Phone alerts unavailable"
              : "Enable phone alerts"}
      </button>
      {status === "error" && errorMessage ? (
        <p className="px-1 text-xs leading-5 text-amber-300">{errorMessage}</p>
      ) : null}
      {status === "done" || status === "testing" || status === "tested" ? (
        <button
          className="w-full rounded-lg border border-white/10 px-3 py-2 text-left text-xs font-semibold text-slate-300 transition hover:border-[#FF5F25] hover:text-white"
          onClick={sendTestPush}
          type="button"
        >
          {status === "testing"
            ? "Sending test..."
            : status === "tested"
              ? "Test sent"
              : "Send test notification"}
        </button>
      ) : null}
    </div>
  );
}
