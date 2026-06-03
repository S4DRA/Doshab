"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { FriendPerson } from "@/types";

type IncomingCall = {
  id: string;
  createdAt: string;
  expiresAt: string;
  caller: FriendPerson;
};

export function IncomingCallWatcher() {
  const [call, setCall] = useState<IncomingCall | null>(null);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadIncomingCall() {
      const response = await fetch("/api/friend-calls/incoming", {
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
        setCall(data?.call ?? null);
      }
    }

    void loadIncomingCall();
    const timer = window.setInterval(() => {
      void loadIncomingCall();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, []);

  async function declineCall() {
    if (!call) {
      return;
    }

    setDeclining(true);

    try {
      await fetch(`/api/friend-calls/${call.id}/decline`, {
        method: "POST",
      });
      setCall(null);
    } finally {
      setDeclining(false);
    }
  }

  if (!call) {
    return null;
  }

  return (
    <div className="fixed inset-x-3 bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] z-[70] sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-96">
      <section className="app-panel border-[#FF5F25]/50 p-4">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <span className="absolute inset-0 rounded-lg bg-[#FF5F25]/30 motion-safe:animate-ping" />
            <AvatarInitials
              imageUrl={call.caller.image}
              value={call.caller.name || call.caller.email}
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
              Incoming call
            </p>
            <h2 className="truncate text-base font-semibold text-white">
              {call.caller.name || call.caller.email}
            </h2>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            aria-busy={declining}
            className="app-button-danger h-11 rounded-lg px-3 text-sm font-semibold transition disabled:opacity-60 sm:h-10"
            disabled={declining}
            onClick={declineCall}
            type="button"
          >
            {declining ? "Declining..." : "Decline"}
          </button>
          <Link
            className="app-button-primary inline-flex h-11 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition sm:h-10"
            href={`/dashboard/calls/${call.id}`}
            title={`Answer call from ${call.caller.name || call.caller.email}`}
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.05 9.88a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92Z" />
            </svg>
            Answer
          </Link>
        </div>
      </section>
    </div>
  );
}
