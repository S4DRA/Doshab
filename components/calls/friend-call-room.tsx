"use client";

import {
  ControlBar,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { FriendPerson } from "@/types";

type FriendCallTokenResponse = {
  token: string;
  livekitUrl: string;
  roomName: string;
  call: {
    id: string;
    friend: FriendPerson;
    status: string;
  };
};

type FriendCallRoomProps = {
  callId: string;
};

export function FriendCallRoom({ callId }: FriendCallRoomProps) {
  const [roomInfo, setRoomInfo] = useState<FriendCallTokenResponse | null>(null);
  const [error, setError] = useState("");
  const [ended, setEnded] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) {
      return;
    }

    loadedRef.current = true;

    async function joinCall() {
      try {
        const response = await fetch(`/api/friend-calls/${callId}/token`, {
          method: "POST",
        });
        const data = (await response.json().catch(() => null)) as
          | (Partial<FriendCallTokenResponse> & { error?: string })
          | null;

        if (!response.ok || !data?.token || !data.livekitUrl || !data.roomName || !data.call) {
          throw new Error(data?.error ?? "Could not join this call.");
        }

        setRoomInfo(data as FriendCallTokenResponse);
      } catch (joinError) {
        setError(joinError instanceof Error ? joinError.message : "Could not join this call.");
      }
    }

    void joinCall();
  }, [callId]);

  useEffect(() => {
    if (!roomInfo || ended) {
      return;
    }

    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/friend-calls/${callId}/status`);

      if (!response.ok) {
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        status?: string;
      } | null;

      if (data?.status === "DECLINED" || data?.status === "MISSED" || data?.status === "ENDED") {
        setEnded(true);
        setError(
          data.status === "DECLINED"
            ? "The call was declined."
            : data.status === "MISSED"
              ? "The call was missed."
              : "The call has ended.",
        );
      }
    }, 3000);

    return () => window.clearInterval(timer);
  }, [callId, ended, roomInfo]);

  async function endCall() {
    await fetch(`/api/friend-calls/${callId}/end`, {
      method: "POST",
    }).catch(() => null);
    setEnded(true);
  }

  if (error || ended || !roomInfo) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center px-4 py-8">
        <section className="w-full max-w-md rounded-xl border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Friend call
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            {error || ended ? "Call unavailable" : "Joining call..."}
          </h1>
          {error ? <p className="mt-3 text-sm leading-6 text-slate-300">{error}</p> : null}
          <Link
            className="mt-6 inline-flex h-10 items-center rounded-lg border border-white/15 px-4 text-sm font-semibold text-slate-200 transition hover:border-[#FF5F25] hover:text-white"
            href="/dashboard/messages"
          >
            Back to messages
          </Link>
        </section>
      </div>
    );
  }

  return (
    <LiveKitRoom
      audio
      className="flex min-h-0 flex-1 flex-col bg-[#070a12]"
      connect
      data-lk-theme="default"
      onDisconnected={() => {
        void endCall();
      }}
      onError={(roomError) => {
        setError(roomError.message || "LiveKit connection failed.");
      }}
      onMediaDeviceFailure={() => {
        setError("Browser media permission was blocked or no microphone was found.");
      }}
      serverUrl={roomInfo.livekitUrl}
      token={roomInfo.token}
      video={false}
    >
      <RoomAudioRenderer />
      <div className="flex min-h-0 flex-1 flex-col px-4 py-4 sm:px-6">
        <section className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          <AvatarInitials
            imageUrl={roomInfo.call.friend.image}
            value={roomInfo.call.friend.name || roomInfo.call.friend.email}
          />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#FF5F25]">
              Friend call
            </p>
            <h1 className="truncate text-xl font-semibold text-white">
              {roomInfo.call.friend.name || roomInfo.call.friend.email}
            </h1>
          </div>
        </section>
        <CallParticipants />
      </div>
      <div className="border-t border-white/8 bg-[#0b1020] px-4 py-4">
        <ControlBar
          controls={{
            microphone: true,
            camera: false,
            screenShare: false,
            chat: false,
            settings: false,
            leave: true,
          }}
          onDeviceError={() => {
            setError("Browser media permission was blocked or no microphone was found.");
          }}
          saveUserChoices={false}
          variation="minimal"
        />
      </div>
    </LiveKitRoom>
  );
}

function CallParticipants() {
  const tracks = useTracks(
    [{ source: Track.Source.Microphone, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  return (
    <div className="grid min-h-0 flex-1 gap-3 sm:grid-cols-2">
      {tracks.map((trackReference) => (
        <ParticipantTile
          className="min-h-56 rounded-xl border border-white/10 bg-[#0b1020]"
          key={trackReference.participant.identity}
          trackRef={trackReference}
        />
      ))}
    </div>
  );
}
