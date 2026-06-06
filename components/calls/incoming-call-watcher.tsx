"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { usePersistentCall } from "@/components/calls/persistent-call-provider";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { FriendPerson } from "@/types";

type IncomingCall = {
  caller: FriendPerson;
  createdAt: string;
  expiresAt: string;
  id: string;
};

type FriendCallTokenResponse = {
  call: {
    friend: FriendPerson;
    id: string;
    status: string;
  };
  livekitUrl: string;
  roomName: string;
  token: string;
};

export function IncomingCallWatcher() {
  const router = useRouter();
  const { startCall } = usePersistentCall();
  const [call, setCall] = useState<IncomingCall | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const acceptButtonRef = useRef<HTMLButtonElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const toneTimerRef = useRef<number | null>(null);

  const stopRingtone = useCallback(() => {
    if (toneTimerRef.current) {
      window.clearInterval(toneTimerRef.current);
      toneTimerRef.current = null;
    }
  }, []);

  const startRingtone = useCallback(() => {
    stopRingtone();

    try {
      const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;

      if (!AudioContextConstructor) {
        return;
      }

      const audioContext = audioContextRef.current ?? new AudioContextConstructor();
      audioContextRef.current = audioContext;

      const playTone = () => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        oscillator.frequency.value = 740;
        oscillator.type = "sine";
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.07, audioContext.currentTime + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.38);
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.42);
      };

      playTone();
      toneTimerRef.current = window.setInterval(playTone, 1800);
    } catch {
      // Browsers can block audio without a recent user gesture. The visual call UI still works.
    }
  }, [stopRingtone]);

  useEffect(() => {
    let cancelled = false;

    async function loadIncomingCall() {
      const response = await fetch("/api/friend-calls/incoming", {
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      }).catch(() => null);

      if (!response?.ok || cancelled) {
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        call?: IncomingCall | null;
      } | null;

      if (!cancelled) {
        setCall((current) => {
          const nextCall = data?.call ?? null;

          return current?.id === nextCall?.id ? current : nextCall;
        });
      }
    }

    void loadIncomingCall();
    const timer = window.setInterval(() => {
      void loadIncomingCall();
    }, 1200);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!call) {
      stopRingtone();
      return;
    }

    acceptButtonRef.current?.focus();

    if (getNotificationSettings().soundEnabled !== false && !muted) {
      startRingtone();
    }

    if ("vibrate" in navigator) {
      navigator.vibrate?.([180, 80, 180]);
    }

    return stopRingtone;
  }, [call, muted, startRingtone, stopRingtone]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-doshab-incoming-call", Boolean(call));

    return () => {
      document.documentElement.removeAttribute("data-doshab-incoming-call");
    };
  }, [call]);

  const declineCall = useCallback(async () => {
    if (!call || declining) {
      return;
    }

    setDeclining(true);
    setError("");
    stopRingtone();

    try {
      await fetch(`/api/friend-calls/${call.id}/decline`, {
        method: "POST",
      });
      setCall(null);
    } catch {
      setError("Could not decline this call.");
    } finally {
      setDeclining(false);
    }
  }, [call, declining, stopRingtone]);

  useEffect(() => {
    if (!call) {
      return;
    }

    const expiresInMs = Date.parse(call.expiresAt) - Date.now();

    if (expiresInMs <= 0) {
      stopRingtone();
      const timer = window.setTimeout(() => setCall(null), 0);

      return () => window.clearTimeout(timer);
    }

    const timer = window.setTimeout(() => {
      stopRingtone();
      setCall(null);
    }, expiresInMs);

    return () => window.clearTimeout(timer);
  }, [call, stopRingtone]);

  useEffect(() => {
    if (!call) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !accepting && !declining) {
        event.preventDefault();
        void declineCall();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [accepting, call, declining, declineCall]);

  useEffect(() => () => {
    stopRingtone();
  }, [stopRingtone]);

  async function acceptCall() {
    if (!call || accepting) {
      return;
    }

    setAccepting(true);
    setError("");
    stopRingtone();

    try {
      const response = await fetch(`/api/friend-calls/${call.id}/token`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => null)) as
        | (Partial<FriendCallTokenResponse> & { error?: string })
        | null;

      if (!response.ok || !data?.token || !data.livekitUrl || !data.roomName || !data.call) {
        throw new Error(data?.error ?? "Could not answer this call.");
      }

      startCall({
        endUrl: `/api/friend-calls/${call.id}/end`,
        href: `/dashboard/calls/${call.id}`,
        id: `friend:${call.id}`,
        kind: "friend",
        livekitUrl: data.livekitUrl,
        roomName: data.roomName,
        statusUrl: `/api/friend-calls/${call.id}/status`,
        subtitle: "Private call",
        title: data.call.friend.name || data.call.friend.email,
        token: data.token,
      });
      setCall(null);
      router.push(`/dashboard/calls/${call.id}`);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : "Could not answer this call.");
    } finally {
      setAccepting(false);
    }
  }

  if (!call) {
    return null;
  }

  const callerLabel = call.caller.name || call.caller.email;

  return (
    <div
      aria-label={`Incoming voice call from ${callerLabel}`}
      aria-modal="true"
      className="fixed inset-0 z-[90] grid place-items-center bg-black/84 px-4 pb-[calc(var(--dashboard-bottom-nav-height)_+_env(safe-area-inset-bottom)_+_1rem)] pt-6 text-white backdrop-blur-md sm:pb-6 sm:pl-20"
      data-doshab-incoming-call-overlay="true"
      role="alertdialog"
    >
      <section className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#FF5F25]/45 bg-[#070a12] p-6 text-center shadow-2xl shadow-black/60 sm:p-8">
        <div className="absolute inset-x-0 top-0 h-1 bg-[#FF5F25]" />
        <div className="mx-auto grid w-fit place-items-center">
          <span className="absolute h-28 w-28 rounded-full bg-[#FF5F25]/20 motion-safe:animate-ping" />
          <AvatarInitials imageUrl={call.caller.image} size="lg" value={callerLabel} />
        </div>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#FF5F25]">
          Incoming voice call
        </p>
        <h2 className="mt-3 truncate text-3xl font-bold text-white">
          {callerLabel}
        </h2>
        <p className="mt-2 text-sm text-slate-300">
          Private call on VAL. Answer to join now.
        </p>
        {error ? (
          <p className="mt-5 rounded-lg border border-amber-300/20 bg-amber-400/10 px-4 py-3 text-sm leading-5 text-amber-100">
            {error}
          </p>
        ) : null}
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            aria-busy={declining}
            className="app-button-danger h-14 rounded-xl px-4 text-base font-bold transition disabled:opacity-60"
            disabled={declining || accepting}
            onClick={declineCall}
            type="button"
          >
            {declining ? "Declining..." : "Decline"}
          </button>
          <button
            aria-busy={accepting}
            className="app-button-primary h-14 rounded-xl px-4 text-base font-bold transition disabled:opacity-60"
            disabled={accepting || declining}
            onClick={acceptCall}
            ref={acceptButtonRef}
            type="button"
          >
            {accepting ? "Answering..." : "Accept"}
          </button>
        </div>
        <button
          className="mt-4 min-h-11 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/30 hover:text-white"
          onClick={() => {
            setMuted((current) => !current);
            stopRingtone();
          }}
          type="button"
        >
          {muted ? "Sound muted" : "Mute ringtone"}
        </button>
      </section>
    </div>
  );
}

type NotificationSettings = {
  soundEnabled?: boolean;
};

function getNotificationSettings(): NotificationSettings {
  try {
    const stored = window.localStorage.getItem("doshabProfileSettings");

    return stored ? (JSON.parse(stored) as NotificationSettings) : {};
  } catch {
    return {};
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
