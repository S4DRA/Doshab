"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { NavigationPending } from "@/components/ui/navigation-pending";
import { useDashboardPeople } from "@/components/layout/dashboard-people-provider";
import { formatUserStatus } from "@/lib/utils";
import type { GroupMemberItem, UserStatus } from "@/types";

const statusOrder: Record<UserStatus, number> = { ONLINE: 0, IDLE: 1, DO_NOT_DISTURB: 2, OFFLINE: 3 };

export function PeopleRail({ members, groupName }: { members?: GroupMemberItem[]; groupName?: string }) {
  const { currentUserId, friends } = useDashboardPeople();
  const pathname = usePathname();
  const listId = useId();
  const [query, setQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [limit, setLimit] = useState(20);
  const people = useMemo(() => (members
    ? members.map(({ user, role }) => ({ ...user, role: role === "MEMBER" ? "Member" : role === "OWNER" ? "Owner" : "Admin" }))
    : friends.map((friend) => ({ ...friend, role: "Friend" })))
    .sort((a, b) => statusOrder[a.status ?? "OFFLINE"] - statusOrder[b.status ?? "OFFLINE"] || a.name.localeCompare(b.name)), [friends, members]);
  const friendIds = useMemo(() => new Set(friends.map(({ id }) => id)), [friends]);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visiblePeople = people.filter((person) => (!onlineOnly || person.status === "ONLINE") && `${person.name} ${person.email}`.toLocaleLowerCase().includes(normalizedQuery));
  const onlineCount = people.filter(({ status }) => status === "ONLINE").length;
  const title = members ? "Members" : "Friends";

  return (
    <aside className={`val-world-rail val-people-rail${members ? " val-space-people-rail" : ""}`} aria-label={members ? `${groupName} members` : "Your friends"}>
      <div className="val-hazard" aria-hidden="true" />
      <header className="val-people-heading"><h2>{title}<span>{people.length}</span></h2><p title={groupName}>{groupName ?? "Your people"}</p></header>
      <div className="val-people-tools">
        <label className="sr-only" htmlFor={`${listId}-search`}>Search {title.toLowerCase()}</label>
        <input id={`${listId}-search`} type="search" placeholder={`Find ${title.toLowerCase()}`} value={query} onChange={(event) => { setQuery(event.target.value); setLimit(20); }} />
        <div className="val-people-filters" aria-label={`${title} filters`}>
          <button type="button" aria-pressed={!onlineOnly} onClick={() => { setOnlineOnly(false); setLimit(20); }}>All</button>
          <button type="button" aria-pressed={onlineOnly} onClick={() => { setOnlineOnly(true); setLimit(20); }}>Online <span>{onlineCount}</span></button>
        </div>
      </div>
      <div className="val-people-scroll">
        <ul id={listId} className="val-people-list">
          {visiblePeople.slice(0, limit).map((person) => {
            const expanded = expandedId === person.id;
            const self = person.id === currentUserId;
            const panelId = `${listId}-${person.id}`;
            return <li key={person.id}>
              <button className="val-person-toggle" type="button" aria-expanded={expanded} aria-controls={panelId} onClick={() => setExpandedId(expanded ? null : person.id)} title={`${person.name} · ${formatUserStatus(person.status ?? "OFFLINE")}`}>
                <span className="val-person-avatar"><AvatarInitials imageUrl={person.image} value={person.name} size="sm" /><span className="val-person-status" data-status={person.status ?? "OFFLINE"} /></span>
                <span className="val-person-copy"><strong>{person.name}{self ? " (you)" : ""}</strong><small>{formatUserStatus(person.status ?? "OFFLINE")}</small></span>
                <span className="val-person-chevron" aria-hidden="true">{expanded ? "−" : "+"}</span>
              </button>
              <div id={panelId} hidden={!expanded} className="val-person-actions">
                {expanded && <>
                <p>{person.role}</p>
                {self ? <Link href="/dashboard/profile">Your profile<NavigationPending /></Link> : friendIds.has(person.id) ? <>
                  <PeopleAction action="/api/private-messages" friendId={person.id} returnTo={pathname} label="Message" pendingLabel="Opening…" />
                  <PeopleAction action="/api/friend-calls/start" friendId={person.id} label="Call" pendingLabel="Calling…" />
                </> : <Link href={`/dashboard/friends?add=1&found=${encodeURIComponent(person.id)}`}>View / add friend<NavigationPending /></Link>}
                </>}
              </div>
            </li>;
          })}
        </ul>
        {!visiblePeople.length && <p className="val-people-empty" role="status">{query ? "No matches. Try another name." : onlineOnly ? `No ${title.toLowerCase()} online.` : members ? "No members to show." : "Your friends will appear here."}</p>}
        {visiblePeople.length > limit && <button className="val-people-more" type="button" onClick={() => setLimit((count) => count + 20)}>Show more ({visiblePeople.length - limit})</button>}
      </div>
      <footer className="val-people-footer"><Link href="/dashboard/friends?add=1">Find friends <span aria-hidden="true">↗</span><NavigationPending /></Link><div className="val-world-image" aria-hidden="true" /><p>A more human internet</p></footer>
    </aside>
  );
}

function PeopleAction({ action, friendId, returnTo, label, pendingLabel }: { action: string; friendId: string; returnTo?: string; label: string; pendingLabel: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const pendingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => {
    const reset = () => { pendingRef.current = false; setPending(false); };
    window.addEventListener("pageshow", reset);
    return () => { window.removeEventListener("pageshow", reset); requestRef.current?.abort(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    if (pendingRef.current) { event.preventDefault(); return; }
    pendingRef.current = true;
    setPending(true);
    setError("");
    if (action !== "/api/friend-calls/start") return;
    event.preventDefault();
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const response = await fetch(action, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ friendId }),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => null) as { href?: string; error?: string } | null;
      if (!response.ok || !result?.href?.startsWith("/dashboard/calls/")) {
        throw new Error(result?.error || "Could not start this call. Please try again.");
      }
      router.push(result.href);
    } catch (cause) {
      if (controller.signal.aborted) return;
      setError(cause instanceof Error ? cause.message : "Could not start this call. Please try again.");
      pendingRef.current = false;
      setPending(false);
    }
  }

  return <form action={action} method="post" onSubmit={submit}>
    <input type="hidden" name="friendId" value={friendId} />
    {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}
    <button type="submit" disabled={pending} aria-busy={pending}>{pending ? pendingLabel : label}</button>
    {error && <p className="val-person-error" role="alert">{error}</p>}
  </form>;
}
