"use client";

import Link from "next/link";
import { useState } from "react";

import { ChannelRoutePrefetcher } from "@/components/groups/channel-route-prefetcher";
import { VoiceChannelJoinButton } from "@/components/groups/voice-channel-join-button";
import { VoiceChannelPresence } from "@/components/groups/voice-channel-presence";
import { useOptionalPersistentCall } from "@/components/calls/persistent-call-provider";
import { cn } from "@/lib/utils";
import type { GroupChannel } from "@/types";

type ChannelListProps = {
  canManageChannels?: boolean;
  channels: GroupChannel[];
  groupId: string;
  onNavigate?: () => void;
  returnToSettings?: boolean;
  selectedChannelId?: string;
  showManagementActions?: boolean;
};

export function ChannelList({
  canManageChannels = false,
  channels,
  groupId,
  onNavigate,
  returnToSettings = false,
  selectedChannelId,
  showManagementActions = false,
}: ChannelListProps) {
  const textChannels = channels.filter((channel) => channel.type === "TEXT");
  const voiceChannels = channels.filter((channel) => channel.type === "VOICE");
  const channelHrefs = textChannels.map(
    (channel) => `/dashboard/groups/${groupId}/channels/${channel.id}`,
  );

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-0 py-2 pr-1 min-[1180px]:gap-4" data-tour-target="channels-list">
      <ChannelRoutePrefetcher hrefs={channelHrefs} />
      <ChannelSection
        channels={textChannels}
        canManageChannels={canManageChannels}
        groupId={groupId}
        label="Text channels"
        onNavigate={onNavigate}
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
        onNavigate={onNavigate}
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
  onNavigate,
  returnToSettings,
  showManagementActions,
}: {
  label: string;
  prefix: string;
  channels: GroupChannel[];
  canManageChannels: boolean;
  groupId: string;
  onNavigate?: () => void;
  returnToSettings: boolean;
  selectedChannelId?: string;
  showManagementActions: boolean;
}) {
  return (
    <section data-tour-target={label === "Voice rooms" ? "voice-channels" : undefined}>
      <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-400 min-[1180px]:text-[10px] min-[1180px]:tracking-[0.18em]">
        {label}
      </p>
      {channels.length ? (
        <div className="space-y-1">
          {channels.map((channel) => (
            channel.type === "VOICE" ? (
              <VoiceRoomItem
                canManageChannels={canManageChannels}
                channel={channel}
                groupId={groupId}
                key={channel.id}
                onNavigate={onNavigate}
                prefix={prefix}
                returnToSettings={returnToSettings}
                selected={selectedChannelId === channel.id}
                showManagementActions={showManagementActions}
              />
            ) : (
              <TextChannelItem
                canManageChannels={canManageChannels}
                channel={channel}
                groupId={groupId}
                key={channel.id}
                onNavigate={onNavigate}
                prefix={prefix}
                returnToSettings={returnToSettings}
                selected={selectedChannelId === channel.id}
                showManagementActions={showManagementActions}
              />
            )
          ))}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-2 text-xs leading-5 text-slate-400">
          No {label.toLowerCase()} yet. Add one from space settings when you are ready.
        </p>
      )}
    </section>
  );
}

function TextChannelItem({
  canManageChannels,
  channel,
  groupId,
  onNavigate,
  prefix,
  returnToSettings,
  selected,
  showManagementActions,
}: ChannelItemProps & {
  prefix: string;
}) {
  return (
    <div
      className={cn(
        "app-row flex w-full min-w-0 items-center justify-between gap-2.5 px-3 py-3 text-left text-sm font-medium text-slate-300 transition hover:border-white/20 min-[1180px]:px-2.5 min-[1180px]:py-2.5",
        selected && "border-[#FF5F25]/60 bg-[#FF5F25]/12 text-white shadow-[inset_3px_0_0_#FF5F25]",
      )}
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-2.5">
        <Link
          aria-current={selected ? "page" : undefined}
          className="flex min-w-0 flex-1 items-center justify-between gap-2"
          href={`/dashboard/groups/${groupId}/channels/${channel.id}`}
          onClick={onNavigate}
        >
          <span className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/7 text-xs font-bold text-slate-200 min-[1180px]:h-7 min-[1180px]:w-7 min-[1180px]:rounded-md min-[1180px]:text-[11px]">
              #
            </span>
            <span className="truncate text-[13px] min-[1180px]:text-xs">
              {prefix} {channel.name}
            </span>
          </span>
          <span className="hidden rounded-md bg-white/7 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 min-[1180px]:inline-flex">
            {selected ? "Selected" : channel.type}
          </span>
        </Link>
        <ChannelDeleteAction
          canManageChannels={canManageChannels}
          channel={channel}
          groupId={groupId}
          returnToSettings={returnToSettings}
          showManagementActions={showManagementActions}
        />
      </div>
    </div>
  );
}

function VoiceRoomItem({
  canManageChannels,
  channel,
  groupId,
  onNavigate,
  prefix,
  returnToSettings,
  selected,
  showManagementActions,
}: ChannelItemProps & {
  prefix: string;
}) {
  const call = useOptionalPersistentCall();
  const activeHere = call?.activeCall?.id === `group:${channel.id}`;
  const [userCollapsed, setUserCollapsed] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const hasParticipants = activeHere && participantCount > 0;
  const expanded = hasParticipants && !userCollapsed;

  return (
    <div
      className={cn(
        "app-row flex w-full min-w-0 flex-col items-stretch gap-2.5 px-3 py-3 text-left text-sm font-medium text-slate-300 transition hover:border-white/20 min-[1180px]:px-2.5 min-[1180px]:py-2.5",
        selected && "border-[#FF5F25]/60 bg-[#FF5F25]/12 text-white shadow-[inset_3px_0_0_#FF5F25]",
      )}
    >
      <div className="flex w-full min-w-0 items-center justify-between gap-2.5">
        <button
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${channel.name} participants`}
          className={cn(
            "grid h-8 w-7 shrink-0 place-items-center rounded-md border border-white/10 bg-black/20 text-slate-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white active:scale-95 min-[1180px]:h-7 min-[1180px]:w-6",
            hasParticipants && "text-[#FFD400]",
          )}
          disabled={!hasParticipants}
          onClick={() => setUserCollapsed((current) => !current)}
          title={hasParticipants ? "Toggle participants" : "No active participants"}
          type="button"
        >
          <ChevronIcon expanded={expanded} />
        </button>
        <VoiceChannelJoinButton
          channelId={channel.id}
          channelName={channel.name}
          groupId={groupId}
          onNavigate={onNavigate}
          prefix={prefix}
        />
        <ChannelDeleteAction
          canManageChannels={canManageChannels}
          channel={channel}
          groupId={groupId}
          returnToSettings={returnToSettings}
          showManagementActions={showManagementActions}
        />
      </div>
      <VoiceChannelPresence
        channelId={channel.id}
        expanded={expanded}
        onParticipantCountChange={(count) => {
          setParticipantCount(count);

          if (count === 0) {
            setUserCollapsed(false);
          }
        }}
      />
    </div>
  );
}

type ChannelItemProps = {
  canManageChannels: boolean;
  channel: GroupChannel;
  groupId: string;
  onNavigate?: () => void;
  returnToSettings: boolean;
  selected: boolean;
  showManagementActions: boolean;
};

function ChannelDeleteAction({
  canManageChannels,
  channel,
  groupId,
  returnToSettings,
  showManagementActions,
}: Omit<ChannelItemProps, "onNavigate" | "selected">) {
  if (!canManageChannels || !showManagementActions) {
    return null;
  }

  return (
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
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cn("h-3.5 w-3.5 transition-transform duration-200", expanded && "rotate-90")}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.4"
      viewBox="0 0 24 24"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
