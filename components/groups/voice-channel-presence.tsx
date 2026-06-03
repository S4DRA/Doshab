"use client";

import { useParticipants } from "@livekit/components-react";

import { useOptionalPersistentCall } from "@/components/calls/persistent-call-provider";
import { AvatarInitials } from "@/components/ui/avatar-initials";

type VoiceChannelPresenceProps = {
  channelId: string;
};

export function VoiceChannelPresence({ channelId }: VoiceChannelPresenceProps) {
  const call = useOptionalPersistentCall();

  if (call?.activeCall?.id !== `group:${channelId}`) {
    return null;
  }

  return <ActiveVoiceChannelPresence />;
}

function ActiveVoiceChannelPresence() {
  const participants = useParticipants();
  const visibleParticipants = participants.slice(0, 5);
  const overflowCount = Math.max(participants.length - visibleParticipants.length, 0);

  if (!participants.length) {
    return (
      <p className="pl-10 text-[11px] text-slate-500">
        Connecting voices...
      </p>
    );
  }

  return (
    <div
      aria-label={`${participants.length} ${participants.length === 1 ? "person" : "people"} connected`}
      className="flex items-center gap-2 pl-10"
    >
      <div className="flex -space-x-2">
        {visibleParticipants.map((participant) => {
          const label = participant.name || participant.identity || "Voice participant";

          return (
            <span
              className="rounded-lg ring-2 ring-[#050705]"
              key={participant.sid || participant.identity}
              title={label}
            >
              <AvatarInitials size="sm" value={label} />
            </span>
          );
        })}
        {overflowCount ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/7 text-[11px] font-bold text-slate-200 ring-2 ring-[#050705]">
            +{overflowCount}
          </span>
        ) : null}
      </div>
      <span className="text-[11px] font-medium text-slate-400">
        {participants.length} connected
      </span>
    </div>
  );
}
