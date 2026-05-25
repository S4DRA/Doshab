import Link from "next/link";

import { cn } from "@/lib/utils";
import type { GroupChannel } from "@/types";

type ChannelListProps = {
  channels: GroupChannel[];
  groupId: string;
  selectedChannelId?: string;
};

export function ChannelList({ channels, groupId, selectedChannelId }: ChannelListProps) {
  const textChannels = channels.filter((channel) => channel.type === "TEXT");
  const voiceChannels = channels.filter((channel) => channel.type === "VOICE");

  return (
    <div className="space-y-6 px-4 py-5">
      <ChannelSection
        channels={textChannels}
        groupId={groupId}
        label="Text channels"
        prefix="#"
        selectedChannelId={selectedChannelId}
      />
      <ChannelSection
        channels={voiceChannels}
        groupId={groupId}
        label="Voice rooms"
        prefix="Voice"
        selectedChannelId={selectedChannelId}
      />
    </div>
  );
}

function ChannelSection({
  label,
  prefix,
  channels,
  groupId,
  selectedChannelId,
}: {
  label: string;
  prefix: string;
  channels: GroupChannel[];
  groupId: string;
  selectedChannelId?: string;
}) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      {channels.length ? (
        <div className="space-y-1">
          {channels.map((channel) => (
            <Link
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-400 transition hover:bg-white/7 hover:text-white",
                selectedChannelId === channel.id && "bg-white/10 text-white",
              )}
              href={`/dashboard/groups/${groupId}/channels/${channel.id}`}
              key={channel.id}
            >
              <span className="truncate">
                {prefix} {channel.name}
              </span>
              <span className="rounded bg-white/7 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                {channel.type}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-500">
          No {label.toLowerCase()} yet.
        </p>
      )}
    </section>
  );
}
