"use client";

import Link from "next/link";
import { useState } from "react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { useDashboardPeople } from "@/components/layout/dashboard-people-provider";
import { formatUserStatus } from "@/lib/utils";
import { matchesSearch } from "@/lib/mobile-navigation";
import { MobileEmpty, MobileHeading, MobileIcon, MobileSection } from "./mobile-ui";
import { useMobileLayout } from "./mobile-shell";

export function MobileFriends({ requests }: { requests: React.ReactNode }) {
  const mobile = useMobileLayout();
  const { friends } = useDashboardPeople();
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  if (!mobile) return null;
  const visible = friends.filter((friend) => matchesSearch(query, friend.name, friend.email) && (filter !== "Online" || friend.status === "ONLINE"));
  return <div className="val-mobile-only val-mobile-page">
    <MobileHeading title="Your people" back="/dashboard" action={<Link className="val-mobile-icon-button" href="/dashboard/friends?add=1" aria-label="Find friends"><MobileIcon name="plus" /></Link>} />
    <label className="val-mobile-search"><MobileIcon name="search" /><input type="search" placeholder="Search your friends" aria-label="Search your friends" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    <div className="val-mobile-tabs" aria-label="Friend views">{["All", "Online", "Requests"].map((item) => <button key={item} type="button" aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div>
    {filter === "Requests" ? <div className="val-mobile-friend-requests">{requests}</div> : <MobileSection title={filter === "Online" ? "Friends online" : "Your friends"}>{visible.length ? <div className="val-mobile-rows">{visible.map((friend) => <form className="val-mobile-row" key={friend.id} action="/api/private-messages" method="post"><input type="hidden" name="friendId" value={friend.id} /><AvatarInitials imageUrl={friend.image} value={friend.name || friend.email} /><span className="val-mobile-row-copy"><strong>{friend.name || friend.email}</strong><small>{formatUserStatus(friend.status)}</small></span><button className="val-mobile-icon-button" type="submit" aria-label={`Message ${friend.name}`}><MobileIcon name="chat" /></button></form>)}</div> : <MobileEmpty>{friends.length ? "No friends match this view." : "Find someone by email to send your first friend request."}</MobileEmpty>}</MobileSection>}
  </div>;
}
