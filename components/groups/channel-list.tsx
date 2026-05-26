import Link from "next/link";

import { cn } from "@/lib/utils";
import type { GroupChannel } from "@/types";

type ChannelListProps = {
  canManageChannels?: boolean;
  channels: GroupChannel[];
  groupId: string;
  selectedChannelId?: string;
};

export function ChannelList({
  canManageChannels = false,
  channels,
  groupId,
  selectedChannelId,
}: ChannelListProps) {
  const textChannels = channels.filter((channel) => channel.type === "TEXT");
  const voiceChannels = channels.filter((channel) => channel.type === "VOICE");

  return (
    <div className="space-y-5 px-1 py-4">
      <ChannelSection
        channels={textChannels}
        canManageChannels={canManageChannels}
        groupId={groupId}
        label="Text channels"
        prefix="#"
        selectedChannelId={selectedChannelId}
      />
      <ChannelSection
        channels={voiceChannels}
        canManageChannels={canManageChannels}
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
  canManageChannels,
  groupId,
  selectedChannelId,
}: {
  label: string;
  prefix: string;
  channels: GroupChannel[];
  canManageChannels: boolean;
  groupId: string;
  selectedChannelId?: string;
}) {
  return (
    <section>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      {channels.length ? (
        <div className="space-y-1">
          {channels.map((channel) => (
            <div
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-sm text-slate-300 transition hover:border-white/10 hover:bg-white/7 hover:text-white",
                selectedChannelId === channel.id && "border-[#FF5F25]/50 bg-[#FF5F25]/12 text-white",
              )}
              key={channel.id}
            >
              <Link
                className="flex min-w-0 flex-1 items-center justify-between gap-3"
                href={`/dashboard/groups/${groupId}/channels/${channel.id}`}
              >
                <span className="truncate">
                  {prefix} {channel.name}
                </span>
                <span className="rounded-md bg-white/7 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400">
                  {channel.type}
                </span>
              </Link>
              {canManageChannels ? (
                <form
                  action={`/api/groups/${groupId}/channels/${channel.id}/delete`}
                  method="post"
                >
                  <button
                    aria-label={`Delete ${channel.name}`}
                    className="inline-flex h-7 items-center gap-1 rounded-md border border-white/20 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-200 transition hover:border-[#FF5F25] hover:bg-[#FF5F25] hover:text-black"
                    type="submit"
                  >
                    <svg
                      aria-hidden="true"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v5" />
                      <path d="M14 11v5" />
                    </svg>
                    Delete
                  </button>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-400">
          No {label.toLowerCase()} yet.
        </p>
      )}
    </section>
  );
}
