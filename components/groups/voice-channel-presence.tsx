"use client";

import { useIsSpeaking, useParticipants } from "@livekit/components-react";
import type { Participant } from "livekit-client";
import { Track } from "livekit-client";
import { useEffect, useState } from "react";

import {
  ParticipantVoiceControlsPanel,
  useOptionalPersistentCall,
} from "@/components/calls/persistent-call-provider";
import { cn, getInitials } from "@/lib/utils";

type VoiceChannelPresenceProps = {
  channelId: string;
  expanded?: boolean;
  onParticipantCountChange?: (count: number) => void;
};

export function VoiceChannelPresence({
  channelId,
  expanded = true,
  onParticipantCountChange,
}: VoiceChannelPresenceProps) {
  const call = useOptionalPersistentCall();

  if (call?.activeCall?.id !== `group:${channelId}`) {
    return null;
  }

  return (
    <ActiveVoiceChannelPresence
      expanded={expanded}
      onParticipantCountChange={onParticipantCountChange}
    />
  );
}

function ActiveVoiceChannelPresence({
  expanded,
  onParticipantCountChange,
}: {
  expanded: boolean;
  onParticipantCountChange?: (count: number) => void;
}) {
  const participants = useParticipants();

  useEffect(() => {
    onParticipantCountChange?.(participants.length);
  }, [onParticipantCountChange, participants.length]);

  if (!participants.length) {
    return null;
  }

  return (
    <div
      aria-label={`${participants.length} ${participants.length === 1 ? "person" : "people"} connected`}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-200 ease-out",
        expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="relative ml-[2.05rem] mt-0.5 space-y-1 border-l border-[#FFD400]/15 pl-3">
          {participants.map((participant) => (
            <VoiceRoomParticipantRow
              key={participant.sid || participant.identity}
              participant={participant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function VoiceRoomParticipantRow({ participant }: { participant: Participant }) {
  const isSpeaking = useIsSpeaking(participant);
  const [controlsOpen, setControlsOpen] = useState(false);
  const label = getParticipantLabel(participant);
  const microphonePublication = participant.getTrackPublication(Track.Source.Microphone);
  const micMuted = microphonePublication?.isMuted ?? !participant.isMicrophoneEnabled;
  const canOpenControls = !participant.isLocal;

  const content = (
    <>
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-md border bg-[#121712] text-[10px] font-bold text-slate-200 shadow-inner shadow-black/40",
          isSpeaking
            ? "border-[#FFD400]/55 text-[#FFD400] shadow-[0_0_14px_rgba(255,212,0,0.18)]"
            : "border-white/10",
          participant.isLocal && "border-white/20 bg-white/[0.08]",
        )}
      >
        {getInitials(label)}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-300">
        {label}
      </span>
      {participant.isLocal ? (
        <span className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          You
        </span>
      ) : null}
      <span className="flex shrink-0 items-center gap-1 text-slate-500">
        {isSpeaking ? <SpeakingIcon /> : null}
        {micMuted ? <MicMutedIcon /> : null}
      </span>
    </>
  );

  if (!canOpenControls) {
    return (
      <div className="flex min-h-9 min-w-0 items-center gap-2 rounded-lg px-2 py-1.5">
        {content}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        aria-expanded={controlsOpen}
        aria-label={`Open local voice controls for ${label}`}
        className="flex min-h-9 w-full min-w-0 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5F25]/45 active:scale-[0.99]"
        onClick={() => setControlsOpen((current) => !current)}
        type="button"
      >
        {content}
      </button>
      {controlsOpen ? (
        <ParticipantVoiceControlsPanel
          onClose={() => setControlsOpen(false)}
          participant={participant}
        />
      ) : null}
    </div>
  );
}

function getParticipantLabel(participant: Participant) {
  return participant.name || participant.identity || "Voice participant";
}

function SpeakingIcon() {
  return (
    <svg
      aria-label="Speaking"
      className="h-3.5 w-3.5 text-[#FFD400]"
      fill="none"
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M7 10v4" />
      <path d="M12 7v10" />
      <path d="M17 10v4" />
    </svg>
  );
}

function MicMutedIcon() {
  return (
    <svg
      aria-label="Microphone muted"
      className="h-3.5 w-3.5"
      fill="none"
      role="img"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 18.5A6.5 6.5 0 0 1 5.5 12" />
      <path d="M18.5 12a6.5 6.5 0 0 1-.7 2.95" />
      <path d="M9 9v3a3 3 0 0 0 4.2 2.75" />
      <path d="M15 9V6a3 3 0 0 0-5.45-1.73" />
      <path d="M12 18.5V22" />
      <path d="M8 22h8" />
      <path d="m4 4 16 16" />
    </svg>
  );
}
