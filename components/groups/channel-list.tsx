import Link from "next/link";

import { cn } from "@/lib/utils";
import type { GroupChannel } from "@/types";

type ChannelListProps = {
  canManageChannels?: boolean;
  channels: GroupChannel[];
  groupId: string;
  returnToSettings?: boolean;
  selectedChannelId?: string;
  showManagementActions?: boolean;
};

export function ChannelList({
  canManageChannels = false,
  channels,
  groupId,
  returnToSettings = false,
  selectedChannelId,
  showManagementActions = false,
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
        returnToSettings={returnToSettings}
        selectedChannelId={selectedChannelId}
        showManagementActions={showManagementActions}
      />
      <ChannelSection
        channels={voiceChannels}
        canManageChannels={canManageChannels}
        groupId={groupId}
        label="Voice rooms"
        prefix="Voice"
        returnToSettings={returnToSettings}
        selectedChannelId={selectedChannelId}
        showManagementActions={showManagementActions}
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
  returnToSettings,
  showManagementActions,
}: {
  label: string;
  prefix: string;
  channels: GroupChannel[];
  canManageChannels: boolean;
  groupId: string;
  returnToSettings: boolean;
  selectedChannelId?: string;
  showManagementActions: boolean;
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
                "app-row flex w-full min-w-0 items-center justify-between gap-2 px-3 py-2.5 text-left text-sm text-slate-300 transition",
                selectedChannelId === channel.id && "border-[#FF5F25]/50 bg-[#FF5F25]/12 text-white",
              )}
              key={channel.id}
            >
              <Link
                className="flex min-w-0 flex-1 items-center justify-between gap-2"
                href={`/dashboard/groups/${groupId}/channels/${channel.id}`}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/7 text-xs font-bold text-slate-200">
                    {channel.type === "TEXT" ? "#" : "V"}
                  </span>
                  <span className="truncate">
                    {prefix} {channel.name}
                  </span>
                </span>
                <span className="hidden rounded-md bg-white/7 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 min-[1400px]:inline-flex">
                  {channel.type}
                </span>
              </Link>
              {canManageChannels && showManagementActions ? (
                <form
                  action={`/api/groups/${groupId}/channels/${channel.id}/delete`}
                  method="post"
                >
                  {returnToSettings ? (
                    <input name="returnTo" type="hidden" value="settings" />
                  ) : null}
                  <button
                    aria-label={`Delete ${channel.name}`}
                    className="inline-flex h-7 w-8 items-center justify-center gap-1 rounded-md border border-white/20 px-0 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-200 transition hover:border-[#FF5F25] hover:bg-[#FF5F25] hover:text-black min-[1400px]:w-auto min-[1400px]:px-2"
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
                    <span className="hidden min-[1400px]:inline">Delete</span>
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
