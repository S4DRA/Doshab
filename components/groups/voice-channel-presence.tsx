"use client";

import { useEffect, useState } from "react";
import { ParticipantVoiceControlsPanel, useOptionalPersistentCall } from "@/components/calls/persistent-call-provider";
import type { MediaParticipant } from "@/lib/media/types";
import { cn, getInitials } from "@/lib/utils";

export function VoiceChannelPresence({ channelId, expanded = true, onParticipantCountChange }: { channelId: string; expanded?: boolean; onParticipantCountChange?: (count: number) => void }) {
  const call = useOptionalPersistentCall(); const participants = call?.activeCall?.id === `group:${channelId}` ? call.snapshot?.participants ?? [] : [];
  useEffect(() => onParticipantCountChange?.(participants.length), [onParticipantCountChange, participants.length]);
  if (!participants.length) return null;
  return <div aria-label={`${participants.length} people connected`} className={cn("grid transition-[grid-template-rows,opacity] duration-200", expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}><div className="min-h-0 overflow-hidden"><div className="relative ml-[2.05rem] mt-0.5 space-y-1 border-l border-[#FFD400]/15 pl-3">{participants.map((participant) => <VoiceRoomParticipantRow key={participant.userId} participant={participant} />)}</div></div></div>;
}
function VoiceRoomParticipantRow({ participant }: { participant: MediaParticipant }) { const [open, setOpen] = useState(false); const label = participant.metadata?.name || participant.userId; return <div className="relative"><button aria-expanded={open} className="flex min-h-9 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/[.045]" onClick={() => setOpen((value) => !value)} type="button"><span className={cn("grid size-6 place-items-center rounded-md border bg-[#121712] text-[10px] font-bold text-slate-200", participant.speaking ? "border-[#FFD400]/55 text-[#FFD400]" : "border-white/10")}>{getInitials(label)}</span><span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-slate-300">{label}</span>{participant.speaking ? <span className="text-[10px] text-[#FFD400]">Speaking</span> : null}{participant.muted ? <span className="text-[10px] text-slate-500">Muted</span> : null}</button>{open ? <ParticipantVoiceControlsPanel onClose={() => setOpen(false)} participant={participant} /> : null}</div>; }
