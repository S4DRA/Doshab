"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { Alert } from "@/components/ui/alert";
import { useDashboardPeople } from "@/components/layout/dashboard-people-provider";
import { ChannelList } from "@/components/groups/channel-list";
import { DialogSurface } from "@/components/ui/dialog-surface";
import type { DashboardGroup } from "@/types";
import { MobileHeading, MobileIcon, MobileSection } from "./mobile-ui";
import { RememberedSpaceLink } from "./mobile-home";
import { useMobileLayout, useMobileRouteDestination } from "./mobile-shell";

export function ChannelHistory({ groupId, channelId, direct = false }: { groupId?: string; channelId: string; direct?: boolean }) {
  useMobileRouteDestination(direct);
  const { currentUserId } = useDashboardPeople();
  useEffect(() => {
    if (!groupId) return;
    try { sessionStorage.setItem(`val:last-channel:${currentUserId}:${groupId}`, channelId); }
    catch (error) { console.warn("Could not remember this channel", error); }
  }, [groupId, channelId, currentUserId]);
  return null;
}

export function MobileSpace({ group, canManage, invite, notice }: { group: DashboardGroup; canManage: boolean; invite?: React.ReactNode; notice?: string }) {
  const mobile = useMobileLayout();
  const [channelsOpen, setChannelsOpen] = useState(false);
  if (!mobile) return null;
  return <div className="val-mobile-only val-mobile-page">
    {notice && <Alert>{notice}</Alert>}
    <MobileHeading title={group.name} back="/dashboard/channels" action={canManage && <Link className="val-mobile-icon-button" href={`/dashboard/groups/${group.id}/settings`} aria-label="Space settings"><MobileIcon name="profile" /></Link>} />
    <section className="val-mobile-section val-mobile-space-overview"><AvatarInitials fallback="group" imageUrl={group.image} value={group.name} size="lg" /><p>{group.description || "Your people. Your space."}</p><small>{group.members?.length ?? 0} members</small></section>
    <RememberedSpaceLink group={group} className="val-mobile-primary val-mobile-open-channel">Continue conversation <MobileIcon name="next" /></RememberedSpaceLink>
    <button className="val-mobile-text-button" type="button" aria-haspopup="dialog" onClick={() => setChannelsOpen(true)}>Choose a channel or voice room</button>
    <MobileSection title="People here"><div className="val-mobile-rows">{group.members?.map(({ user }) => <div className="val-mobile-row" key={user.id}><AvatarInitials imageUrl={user.image} value={user.name || user.email} /><span className="val-mobile-row-copy"><strong>{user.name || user.email}</strong><small>{user.status === "ONLINE" ? "Online" : user.status === "IDLE" ? "Idle" : user.status === "DO_NOT_DISTURB" ? "Do not disturb" : "Offline"}</small></span></div>)}</div></MobileSection>
    {canManage && invite && <details className="val-mobile-requests"><summary>Invite friends <MobileIcon name="next" /></summary>{invite}</details>}
    {channelsOpen && <DialogSurface title="Channels" onClose={() => setChannelsOpen(false)}><ChannelList channels={group.channels ?? []} groupId={group.id} canManageChannels={canManage} onNavigate={() => setChannelsOpen(false)} /></DialogSurface>}
  </div>;
}
