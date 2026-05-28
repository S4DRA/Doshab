"use client";

import { useState } from "react";

import {
  PersistentCallSurface,
  usePersistentCall,
} from "@/components/calls/persistent-call-provider";

type LiveKitTokenResponse = {
  token: string;
  livekitUrl: string;
  roomName: string;
  participant: {
    id: string;
    name: string;
    email: string;
  };
};

type LiveKitVoiceRoomProps = {
  channelId: string;
  channelName: string;
  groupId?: string;
};

export function LiveKitVoiceRoom({ channelId, channelName, groupId }: LiveKitVoiceRoomProps) {
  const { activeCall, startCall } = usePersistentCall();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeHere = activeCall?.id === `group:${channelId}`;

  async function joinRoom() {
    setIsJoining(true);
    setError(null);

    try {
      const response = await fetch("/api/livekit/token", {
        body: JSON.stringify({ channelId }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      });

      const data = (await response.json()) as Partial<LiveKitTokenResponse> & {
        error?: string;
      };

      if (!response.ok || !data.token || !data.livekitUrl || !data.roomName) {
        throw new Error(data.error ?? "Could not join this voice room.");
      }

      startCall({
        href: groupId ? `/dashboard/groups/${groupId}/channels/${channelId}` : undefined,
        id: `group:${channelId}`,
        kind: "group",
        livekitUrl: data.livekitUrl,
        roomName: data.roomName,
        subtitle: data.roomName,
        title: channelName,
        token: data.token,
      });
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Could not join this voice room.",
      );
    } finally {
      setIsJoining(false);
    }
  }

  return (
    activeHere ? (
      <PersistentCallSurface sessionId={`group:${channelId}`} />
    ) : (
    <div className="grid min-h-0 flex-1 place-items-center px-5 py-8 min-[1180px]:place-items-start min-[1180px]:px-8 min-[1180px]:py-8">
      <section className="app-panel w-full max-w-2xl p-6 text-center min-[1180px]:max-w-4xl min-[1180px]:p-0 min-[1180px]:text-left">
        <div className="min-[1180px]:grid min-[1180px]:grid-cols-[minmax(0,1fr)_18rem] min-[1180px]:gap-0">
          <div className="p-6 min-[1180px]:p-8">
            <div className="flex flex-col items-center gap-3 min-[1180px]:items-start">
              <span className="grid h-12 w-12 place-items-center rounded-lg border border-[#FF5F25]/35 bg-[#FF5F25]/10 text-[#FF8A5F] min-[1180px]:h-11 min-[1180px]:w-11">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 18.5a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v9a3.5 3.5 0 0 0 3.5 3.5Z" />
                  <path d="M19 11v4a7 7 0 0 1-14 0v-4" />
                  <path d="M12 22v-3" />
                </svg>
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25] min-[1180px]:text-[11px]">
                  Voice room
                </p>
                <h2 className="mt-3 text-2xl font-bold text-white min-[1180px]:text-3xl">{channelName}</h2>
              </div>
            </div>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400 min-[1180px]:mx-0 min-[1180px]:mt-4 min-[1180px]:max-w-xl">
              Join this room once and keep talking while you move around the dashboard.
            </p>

            {error ? (
              <p className="mt-5 rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            <button
              className="app-button-primary mt-6 h-11 rounded-lg px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 min-[1180px]:h-10 min-[1180px]:px-4 min-[1180px]:text-xs"
              disabled={isJoining}
              onClick={joinRoom}
              type="button"
            >
              {isJoining ? "Joining..." : "Join voice room"}
            </button>
          </div>
          <div className="hidden border-l border-white/10 bg-[#0d100e]/70 p-6 min-[1180px]:block">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
              Session
            </p>
            <div className="mt-4 space-y-3">
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-semibold text-white">Audio</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Microphone-first room</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <p className="text-xs font-semibold text-white">Screen share</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">Available after joining</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
    )
  );
}
