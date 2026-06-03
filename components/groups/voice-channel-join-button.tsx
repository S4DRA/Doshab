"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useOptionalPersistentCall } from "@/components/calls/persistent-call-provider";
import { cn } from "@/lib/utils";

type LiveKitTokenResponse = {
  token: string;
  livekitUrl: string;
  roomName: string;
};

type VoiceChannelJoinButtonProps = {
  channelId: string;
  channelName: string;
  groupId: string;
  prefix: string;
};

export function VoiceChannelJoinButton({
  channelId,
  channelName,
  groupId,
  prefix,
}: VoiceChannelJoinButtonProps) {
  const call = useOptionalPersistentCall();
  const router = useRouter();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const href = `/dashboard/groups/${groupId}/channels/${channelId}`;
  const activeHere = call?.activeCall?.id === `group:${channelId}`;

  async function joinVoiceChannel() {
    if (isJoining) {
      return;
    }

    if (activeHere) {
      router.push(href);
      return;
    }

    if (!call) {
      return;
    }

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

      call.startCall({
        href,
        id: `group:${channelId}`,
        kind: "group",
        livekitUrl: data.livekitUrl,
        roomName: data.roomName,
        subtitle: data.roomName,
        title: channelName,
        token: data.token,
      });
      router.push(href);
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
    <div className="min-w-0 flex-1">
      <button
        aria-busy={isJoining}
        aria-label={`${activeHere ? "Connected to" : "Join"} ${channelName}`}
        aria-pressed={activeHere}
        className={cn(
          "flex w-full min-w-0 items-center justify-between gap-2 rounded-lg text-left outline-none transition focus-visible:ring-2 focus-visible:ring-[#FF5F25]/60",
          activeHere && "text-white",
          isJoining && "opacity-80",
        )}
        disabled={!call || isJoining}
        onClick={joinVoiceChannel}
        title={error ?? (activeHere ? "Open voice room" : "Join voice room")}
        type="button"
      >
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/7 text-xs font-bold text-slate-200 min-[1180px]:h-7 min-[1180px]:w-7 min-[1180px]:rounded-md min-[1180px]:text-[11px]",
              activeHere && "border-[#FF5F25]/50 bg-[#FF5F25]/15 text-[#FFB199]",
            )}
          >
            V
          </span>
          <span className="truncate text-[13px] min-[1180px]:text-xs">
            {prefix} {channelName}
          </span>
        </span>
        <span
          className={cn(
            "h-7 min-w-7 shrink-0 items-center justify-center rounded-md px-1.5 text-[10px] font-semibold text-slate-400",
            isJoining ? "inline-flex bg-[#FF5F25] text-black shadow-[0_0_18px_rgba(255,95,37,0.28)]" : "hidden bg-white/7 min-[1180px]:inline-flex",
            activeHere && "bg-[#FF5F25]/15 text-[#FFB199]",
            error && "bg-red-500/10 text-red-200",
          )}
        >
          {isJoining ? (
            <span
              aria-hidden="true"
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
          ) : (
            error ? "Retry" : activeHere ? "Connected" : "VOICE"
          )}
        </span>
      </button>
      {error ? (
        <p className="mt-1 pl-10 text-[11px] text-red-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
