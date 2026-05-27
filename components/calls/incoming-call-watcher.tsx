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
    <div className="fixed inset-x-3 bottom-3 z-50 sm:inset-x-auto sm:right-4 sm:w-96">
      <section className="rounded-xl border border-[#FF5F25]/50 bg-[#080b12] p-4 shadow-2xl shadow-black/40">
        <div className="flex items-center gap-3">
          <AvatarInitials
            imageUrl={call.caller.image}
            value={call.caller.name || call.caller.email}
          />
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
            className="h-10 rounded-lg border border-white/15 px-3 text-sm font-semibold text-slate-200 transition hover:border-white/30 disabled:opacity-60"
            disabled={declining}
            onClick={declineCall}
            type="button"
          >
            {declining ? "Declining..." : "Decline"}
          </button>
          <Link
            className="inline-flex h-10 items-center justify-center rounded-lg bg-[#FF5F25] px-3 text-sm font-semibold text-white transition hover:bg-[#ff7847]"
            href={`/dashboard/calls/${call.id}`}
          >
            Answer
          </Link>
        </div>
      </section>
    </div>
  );
}
