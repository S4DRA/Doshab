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
    <div className="grid min-h-0 flex-1 place-items-center px-5 py-8">
      <section className="app-panel w-full max-w-2xl p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          Voice room
        </p>
        <h2 className="mt-3 text-2xl font-bold text-white">{channelName}</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          Join this room once and keep talking while you move around the dashboard.
        </p>

        {error ? (
          <p className="mt-5 rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <button
          className="app-button-primary mt-6 h-11 rounded-lg px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isJoining}
          onClick={joinRoom}
          type="button"
        >
          {isJoining ? "Joining..." : "Join voice room"}
        </button>
      </section>
    </div>
    )
  );
}
