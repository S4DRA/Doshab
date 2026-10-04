"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { Alert } from "@/components/ui/alert";
import { useDashboardPeople } from "@/components/layout/dashboard-people-provider";
import { decryptMessageContent } from "@/lib/e2ee-message.client";
import { formatUserStatus } from "@/lib/utils";
import { rememberedChannelHref } from "@/lib/mobile-navigation";
import type { DashboardGroup, MessageThread } from "@/types";
import { MobileEmpty, MobileIcon, MobileSection } from "./mobile-ui";
import { useMobileLayout } from "./mobile-shell";
import { MobileHomeSections } from "./mobile-home-sections";

export function RememberedSpaceLink({ group, className, children }: { group: DashboardGroup; className?: string; children: React.ReactNode }) {
  const router = useRouter();
  const { currentUserId } = useDashboardPeople();
  const href = rememberedChannelHref(group, null);
  return <Link className={className} href={href} onClick={(event) => {
    try {
      const remembered = rememberedChannelHref(group, sessionStorage.getItem(`val:last-channel:${currentUserId}:${group.id}`));
      if (remembered !== href && !event.metaKey && !event.ctrlKey && !event.shiftKey) { event.preventDefault(); router.push(remembered); }
    } catch (error) { console.warn("Channel history is unavailable", error); }
  }}>{children}</Link>;
}

export function MobileThreadList({ threads }: { threads: MessageThread[] }) {
  const [previews, setPreviews] = useState<Record<string, string>>({});
  useEffect(() => {
    let active = true;
    void Promise.all(threads.map(async (thread) => [thread.id, thread.lastMessageEncryptedContent ? (await decryptMessageContent(thread.lastMessageEncryptedContent)).text : "Start the conversation"] as const))
      .then((entries) => { if (active) setPreviews(Object.fromEntries(entries)); })
      .catch((error) => { console.warn("Conversation previews are unavailable", error); if (active) setPreviews(Object.fromEntries(threads.map((thread) => [thread.id, "Open conversation to read messages"]))); });
    return () => { active = false; };
  }, [threads]);
  return threads.length ? <div className="val-mobile-rows">{threads.map((thread) => <Link className="val-mobile-row" href={thread.channelId ? `/dashboard/groups/${thread.id}/channels/${thread.channelId}` : `/dashboard/groups/${thread.id}`} key={thread.id}>
    <AvatarInitials imageUrl={thread.friend?.image} value={thread.name} /><span className="val-mobile-row-copy"><strong>{thread.name}</strong><small>{previews[thread.id] ?? "Opening encrypted preview…"}</small></span><MobileIcon name="next" />
  </Link>)}</div> : <MobileEmpty>No conversations yet. <Link href="/dashboard/messages">Message a friend</Link>.</MobileEmpty>;
}

export function MobileSpaceCards({ groups }: { groups: DashboardGroup[] }) {
  return groups.length ? <div className="val-mobile-space-grid">{groups.map((group) => <RememberedSpaceLink group={group} className="val-mobile-space-card" key={group.id}>
    <div className="val-mobile-space-image"><AvatarInitials fallback="group" imageUrl={group.image} value={group.name} size="lg" /></div>
    <strong>{group.name}</strong><small>{group.members?.length ?? 0} members</small><span className="val-mobile-avatar-stack">{group.members?.slice(0, 3).map(({ user }) => <AvatarInitials imageUrl={user.image} value={user.name || user.email} key={user.id} size="sm" />)}<MobileIcon name="next" /></span>
  </RememberedSpaceLink>)}</div> : <MobileEmpty>Your people need a place. <Link href="/dashboard/create">Create your first space</Link>.</MobileEmpty>;
}

export function MobileHome({ name, groups, threads, requests, message, messageTone }: { name: string; groups: DashboardGroup[]; threads: MessageThread[]; requests?: React.ReactNode; message?: string; messageTone?: "neutral" | "success" | "error" | "warning" }) {
  const { friends, currentUserId } = useDashboardPeople();
  const mobile = useMobileLayout();
  if (!mobile) return null;
  const online = friends.filter((friend) => friend.status === "ONLINE");
  const voiceSpace = groups.find((group) => group.channels?.some((channel) => channel.type === "VOICE"));
  const voiceRoom = voiceSpace?.channels?.find((channel) => channel.type === "VOICE");
  const recentThreads = threads.slice(0, 4);
  const recentGroups = groups.slice(0, 4);
  return <div className="val-mobile-only val-mobile-page val-mobile-home">
    {message && <Alert tone={messageTone ?? "neutral"}>{message}</Alert>}
    <header className="val-mobile-welcome"><div><small>Welcome back,</small><h1>{name}</h1><p>Have Fun!<br />:)</p></div><div className="val-mobile-welcome-art" aria-hidden="true" /></header>
    <div className="val-mobile-quick-actions"><Link href="/dashboard/messages"><MobileIcon name="chat" /><span>Messages<small>Pick up a conversation</small></span><MobileIcon name="next" /></Link><Link href="/dashboard/create"><MobileIcon name="plus" /><span>Create space</span></Link></div>
    {voiceSpace && voiceRoom && <Link className="val-mobile-voice-shortcut" href={`/dashboard/groups/${voiceSpace.id}/channels/${voiceRoom.id}`}><MobileIcon name="voice" /><span><strong>{voiceRoom.name}</strong><small>{voiceSpace.name} · Open voice room</small></span><MobileIcon name="next" /></Link>}
    <MobileHomeSections key={currentUserId} userId={currentUserId} sections={{
      conversations: { title: "Recent conversations", render: (handle) => <MobileSection title="Recent conversations" href="/dashboard/messages" action={handle}><MobileThreadList threads={recentThreads} /></MobileSection> },
      spaces: { title: "Your spaces", render: (handle) => <MobileSection title="Your spaces" href="/dashboard/channels" action={handle}><MobileSpaceCards groups={recentGroups} /></MobileSection> },
      friends: { title: "Friends online", render: (handle) => <MobileSection title="Friends online" href="/dashboard/friends" action={handle}>{online.length ? <div className="val-mobile-friend-strip">{online.slice(0, 8).map((friend) => <form action="/api/private-messages" method="post" key={friend.id}><input type="hidden" name="friendId" value={friend.id} /><button type="submit"><AvatarInitials imageUrl={friend.image} value={friend.name || friend.email} /><strong>{friend.name || friend.email}</strong><small>{formatUserStatus(friend.status)}</small></button></form>)}</div> : <MobileEmpty>No friends online right now. <Link href="/dashboard/friends">See your friends</Link>.</MobileEmpty>}</MobileSection> },
      requests: { title: "Requests & invitations", render: (handle) => <><details className="val-mobile-requests"><summary>Requests &amp; invitations <MobileIcon name="next" /></summary>{requests}</details><div className="val-home-requests-handle">{handle}</div></> },
    }} />
  </div>;
}
