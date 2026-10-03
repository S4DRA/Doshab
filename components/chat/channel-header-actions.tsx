"use client";

import Link from "next/link";
import { useState } from "react";
import { ChannelList } from "@/components/groups/channel-list";
import { PeopleRail } from "@/components/layout/people-rail";
import { DialogSurface } from "@/components/ui/dialog-surface";
import { NavigationPending } from "@/components/ui/navigation-pending";
import type { GroupChannel, GroupMemberItem } from "@/types";

type ChannelHeaderActionsProps = {
  canInvite?: boolean;
  canManageSpace?: boolean;
  channels: GroupChannel[];
  currentUserId?: string;
  groupId: string;
  groupName?: string;
  members: GroupMemberItem[];
  selectedChannelId?: string;
};

export function ChannelHeaderActions({ canInvite = false, canManageSpace = false, channels, groupId, groupName, members, selectedChannelId }: ChannelHeaderActionsProps) {
  const [openPanel, setOpenPanel] = useState<"channels" | "members" | "more" | null>(null);
  const onlineCount = members.filter(({ user }) => user.status === "ONLINE").length;
  const toggle = (panel: typeof openPanel) => setOpenPanel((current) => current === panel ? null : panel);

  return <>
    <div className="val-channel-actions">
      <button className="val-channel-action val-channels-action" type="button" aria-haspopup="dialog" aria-expanded={openPanel === "channels"} onClick={() => toggle("channels")}>
        <ActionIcon kind="channels" /><span>Channels<small>Switch room</small></span>
      </button>
      <button className="val-channel-action" type="button" aria-haspopup="dialog" aria-expanded={openPanel === "members"} onClick={() => toggle("members")}>
        <ActionIcon kind="members" /><span>Members<small>{onlineCount} online</small></span>
      </button>
      {canInvite && <Link className="val-channel-action val-desktop-channel-action" href={`/dashboard/groups/${groupId}/settings#invite-friends`}>
        <ActionIcon kind="invite" /><span>Invite<small>Invite friends</small></span><NavigationPending />
      </Link>}
      {canManageSpace && <Link className="val-channel-action val-desktop-channel-action" href={`/dashboard/groups/${groupId}/settings`}>
        <ActionIcon kind="settings" /><span>Space settings<small>Manage</small></span><NavigationPending />
      </Link>}
      <button className="val-channel-action val-more-channel-action" type="button" aria-haspopup="dialog" aria-expanded={openPanel === "more"} onClick={() => toggle("more")}>
        <ActionIcon kind="more" /><span>More<small>Space actions</small></span>
      </button>
    </div>
    {openPanel && <DialogSurface title={openPanel === "channels" ? "Channels" : openPanel === "members" ? "Members" : "Space actions"} onClose={() => setOpenPanel(null)}>
      {openPanel === "channels" && <>
        <Link className="val-dialog-link" href={`/dashboard/groups/${groupId}`} onClick={() => setOpenPanel(null)}>Space overview<NavigationPending /></Link>
        <ChannelList canManageChannels={canManageSpace} channels={channels} groupId={groupId} selectedChannelId={selectedChannelId} onNavigate={() => setOpenPanel(null)} />
      </>}
      {openPanel === "members" && <PeopleRail groupName={groupName} members={members} mode="panel" />}
      {openPanel === "more" && <div className="val-dialog-links">
        <Link className="val-dialog-link" href={`/dashboard/groups/${groupId}`} onClick={() => setOpenPanel(null)}>Space overview<NavigationPending /></Link>
        <Link className="val-dialog-link" href="/dashboard/messages" onClick={() => setOpenPanel(null)}>Private messages<NavigationPending /></Link>
        {canInvite && <Link className="val-dialog-link" href={`/dashboard/groups/${groupId}/settings#invite-friends`} onClick={() => setOpenPanel(null)}>Invite friends<NavigationPending /></Link>}
        {canManageSpace && <Link className="val-dialog-link" href={`/dashboard/groups/${groupId}/settings`} onClick={() => setOpenPanel(null)}>Space settings<NavigationPending /></Link>}
      </div>}
    </DialogSurface>}
  </>;
}

function ActionIcon({ kind }: { kind: "channels" | "members" | "invite" | "settings" | "more" }) {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {kind === "channels" && <path d="m10 3-2 18m8-18-2 18M4 9h17M3 15h17" />}
    {(kind === "members" || kind === "invite") && <><circle cx="9" cy="8" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2" />{kind === "invite" ? <path d="M19 7v8m-4-4h8" /> : <path d="M17 5a3 3 0 0 1 0 6m2 10v-2a6 6 0 0 0-2-4.5" />}</>}
    {kind === "settings" && <><path d="m10 3-.6 2.4-2 .9-2.3-.7-2 3.5 1.7 1.7v2.4l-1.7 1.7 2 3.5 2.3-.7 2 .9L10 21h4l.6-2.4 2-.9 2.3.7 2-3.5-1.7-1.7v-2.4l1.7-1.7-2-3.5-2.3.7-2-.9L14 3Z" /><circle cx="12" cy="12" r="3" /></>}
    {kind === "more" && <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>}
  </svg>;
}
