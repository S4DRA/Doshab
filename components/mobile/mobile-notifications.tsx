"use client";

import Link from "next/link";
import { useState } from "react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { DashboardNotification } from "@/types";
import { MobileEmpty, MobileHeading, MobileIcon, MobileSection } from "./mobile-ui";

const filters = { All: [], Messages: ["MESSAGE"], Calls: ["INCOMING_CALL", "MISSED_CALL"], Invitations: ["GROUP_INVITE"], Social: ["FRIEND_REQUEST"], System: ["SYSTEM"] } satisfies Record<string, string[]>;

export function MobileNotifications({ initial }: { initial: DashboardNotification[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<keyof typeof filters>("All");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const markRead = async (ids: string[]) => {
    if (!ids.length || busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/notifications/read", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) });
      if (!response.ok) throw new Error("Could not mark notifications as read.");
      setItems((previous) => previous.map((item) => ids.includes(item.id) ? { ...item, readAt: new Date().toISOString() } : item));
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Please try again."); }
    finally { setBusy(false); }
  };
  const filtered = items.filter((item) => filter === "All" || (filters[filter] as string[]).includes(item.type));
  return <main className="app-page-scroll"><div className="val-mobile-page val-notifications-page">
    <MobileHeading title="Notifications" back="/dashboard" />
    <div className="val-mobile-tabs" aria-label="Notification filters">{Object.keys(filters).map((name) => <button type="button" key={name} aria-pressed={filter === name} onClick={() => setFilter(name as keyof typeof filters)}>{name}</button>)}</div>
    <button className="val-mobile-text-button" disabled={busy || !items.some((item) => !item.readAt)} type="button" onClick={() => void markRead(items.filter((item) => !item.readAt).map((item) => item.id))}>{busy ? "Updating…" : "Mark all as read"}</button>
    {error && <p role="alert">{error}</p>}
    <MobileSection title={filter === "All" ? "Recent activity" : filter}>{filtered.length ? <div className="val-mobile-rows">{filtered.map((item) => <Link className={`val-mobile-row${!item.readAt ? " is-unread" : ""}`} href={item.href} key={item.id} onClick={() => { if (!item.readAt) void markRead([item.id]); }}><AvatarInitials imageUrl={item.actor?.image} value={item.actor?.name ?? "VAL"} /><span className="val-mobile-row-copy"><strong>{!item.readAt && <span className="sr-only">Unread: </span>}{item.title}</strong><small>{item.body}</small><time>{new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time></span><MobileIcon name="next" /></Link>)}</div> : <MobileEmpty>You’re all caught up.</MobileEmpty>}</MobileSection>
    <Link className="val-mobile-row" href="/dashboard/profile#notifications">Notification preferences <MobileIcon name="next" /></Link>
  </div></main>;
}
