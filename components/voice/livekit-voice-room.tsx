"use client";

import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import { useState } from "react";

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
};

export function LiveKitVoiceRoom({ channelId, channelName }: LiveKitVoiceRoomProps) {
  const [roomInfo, setRoomInfo] = useState<LiveKitTokenResponse | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDisconnected, setHasDisconnected] = useState(false);

  async function joinRoom() {
    setIsJoining(true);
    setError(null);
    setHasDisconnected(false);

    try {
      const response = await fetch("/api/livekit/token", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ channelId }),
      });

      const data = (await response.json()) as Partial<LiveKitTokenResponse> & {
        error?: string;
      };

      if (!response.ok || !data.token || !data.livekitUrl || !data.roomName) {
        throw new Error(data.error ?? "Could not join this voice room.");
      }

      setRoomInfo(data as LiveKitTokenResponse);
    } catch (joinError) {
      setRoomInfo(null);
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Could not join this voice room.",
      );
    } finally {
      setIsJoining(false);
    }
  }

  if (!roomInfo) {
    return (
      <div className="grid min-h-0 flex-1 place-items-center px-5 py-8">
        <section className="w-full max-w-2xl rounded-lg border border-white/10 bg-white/[0.04] p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Voice room
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white">{channelName}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
            Join this live voice/video room when you are ready. Your browser may
            ask for microphone or camera permission.
          </p>

          {error ? (
            <p className="mt-5 rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </p>
          ) : null}

          {hasDisconnected ? (
            <p className="mt-5 rounded-md border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
              You left the room.
            </p>
          ) : null}

          <button
            className="mt-6 h-11 rounded-md bg-[#FF5F25] px-5 text-sm font-semibold text-white shadow-lg shadow-[#FF5F25]/30 transition hover:bg-[#FF5F25]/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
            disabled={isJoining}
            onClick={joinRoom}
            type="button"
          >
            {isJoining ? "Joining..." : "Join Voice"}
          </button>
        </section>
      </div>
    );
  }

  return (
    <LiveKitRoom
      audio={false}
      className="flex min-h-0 flex-1 flex-col bg-[#070a12]"
      connect
      data-lk-theme="default"
      onDisconnected={() => {
        setRoomInfo(null);
        setHasDisconnected(true);
      }}
      onError={(roomError) => {
        setRoomInfo(null);
        setError(roomError.message || "LiveKit connection failed.");
      }}
      onMediaDeviceFailure={() => {
        setError("Browser media permission was blocked or no device was found.");
      }}
      serverUrl={roomInfo.livekitUrl}
      token={roomInfo.token}
      video={false}
    >
      <RoomAudioRenderer />
      <div className="flex min-h-0 flex-1 flex-col px-5 py-6">
        <div className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Connected
          </p>
          <h2 className="mt-2 text-xl font-bold text-white">{channelName}</h2>
          <p className="mt-1 text-sm text-slate-400">{roomInfo.roomName}</p>
        </div>
        <ParticipantGrid />
      </div>
      <div className="border-t border-white/8 bg-[#0b1020] px-5 py-4">
        <ControlBar
          controls={{
            microphone: true,
            camera: true,
            screenShare: false,
            chat: false,
            settings: false,
            leave: true,
          }}
          onDeviceError={() => {
            setError("Browser media permission was blocked or no device was found.");
          }}
          saveUserChoices={false}
          variation="minimal"
        />
      </div>
    </LiveKitRoom>
  );
}

function ParticipantGrid() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.Microphone, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  );

  if (!tracks.length) {
    return (
      <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-white/10 bg-white/[0.03] p-6 text-sm text-slate-500">
        Waiting for participants.
      </div>
    );
  }

  return (
    <GridLayout className="min-h-0 flex-1 rounded-lg bg-[#0b1020] p-3" tracks={tracks}>
      <ParticipantTile />
    </GridLayout>
  );
}
