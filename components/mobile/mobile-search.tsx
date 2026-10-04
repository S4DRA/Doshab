"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useState } from "react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { decryptMessageContent } from "@/lib/e2ee-message.client";
import { matchesSearch } from "@/lib/mobile-navigation";
import type { DashboardGroup, FriendPerson } from "@/types";
import { MobileEmpty, MobileHeading, MobileIcon, MobileSection } from "./mobile-ui";
import { RememberedSpaceLink } from "./mobile-home";

export type SearchMessage = { id: string; content: string; createdAt: string; sender: { name: string }; channel: { id: string; name: string; group: { id: string; name: string } } };

export function MobileSearch({ people, groups, messages, userId }: { people: FriendPerson[]; groups: DashboardGroup[]; messages: SearchMessage[]; userId: string }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [recent, setRecent] = useState<string[]>([]);
  const [decrypted, setDecrypted] = useState<SearchMessage[] | null>(null);
  const [error, setError] = useState("");
  const search = useDeferredValue(query.trim());
  const needsMessages = search.length >= 2 && ["All", "Messages"].includes(filter);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { const stored: unknown = JSON.parse(localStorage.getItem(`val:searches:${userId}`) ?? "[]"); if (Array.isArray(stored)) setRecent(stored.filter((item): item is string => typeof item === "string").slice(0, 6)); }
      catch (failure) { console.warn("Recent searches are unavailable", failure); }
    });
    return () => cancelAnimationFrame(frame);
  }, [userId]);
  useEffect(() => {
    if (!needsMessages || decrypted) return;
    let active = true;
    void Promise.all(messages.map(async (message) => ({ ...message, content: (await decryptMessageContent(message.content)).text })))
      .then((items) => { if (active) setDecrypted(items); })
      .catch((failure) => { console.error("Message search failed", failure); if (active) setError("Could not open encrypted messages. Try searching inside a conversation."); });
    return () => { active = false; };
  }, [needsMessages, messages, decrypted]);
  const remember = (values: string[]) => {
    setRecent(values);
    try { localStorage.setItem(`val:searches:${userId}`, JSON.stringify(values)); }
    catch (failure) { console.warn("Could not save recent searches", failure); }
  };
  const channels = groups.flatMap((group) => (group.channels ?? []).map((channel) => ({ ...channel, group })));
  const friendIds = new Set(people.map((person) => person.id));
  const knownPeople = new Map(groups.flatMap((group) => (group.members ?? []).map(({ user }) => [user.id, user] as const)));
  for (const person of people) knownPeople.set(person.id, person);
  knownPeople.delete(userId);
  const matchedPeople = [...knownPeople.values()].filter((person) => matchesSearch(search, person.name, person.email));
  const matchedGroups = groups.filter((group) => matchesSearch(search, group.name, group.description));
  const matchedChannels = channels.filter((channel) => matchesSearch(search, channel.name, channel.group.name));
  const visible = (name: string) => filter === "All" || filter === name;
  return <main className="app-page-scroll"><div className="val-mobile-page val-search-page">
    <MobileHeading title="Search" />
    <form className="val-mobile-search" onSubmit={(event) => { event.preventDefault(); if (query.trim()) remember([query.trim(), ...recent.filter((item) => item !== query.trim())].slice(0, 6)); }}><MobileIcon name="search" /><input autoComplete="off" aria-label="Search people, spaces, channels and messages" placeholder="People, spaces, conversations…" type="search" value={query} maxLength={100} onChange={(event) => setQuery(event.target.value)} /><button className="val-mobile-icon-button" type="submit" aria-label="Search"><MobileIcon name="next" /></button></form>
    <div className="val-mobile-tabs" aria-label="Search filters">{["All", "People", "Spaces", "Channels", "Messages"].map((item) => <button type="button" key={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>{item}</button>)}</div>
    {!search && recent.length > 0 && <MobileSection title="Recent searches"><div className="val-mobile-tabs">{recent.map((item) => <button key={item} type="button" onClick={() => setQuery(item)}>{item}</button>)}<button type="button" onClick={() => remember([])}>Clear history</button></div></MobileSection>}
    {!search ? <MobileEmpty>Find people and channels in your spaces. Message search covers your 100 most recent messages.</MobileEmpty> : <>
      {visible("People") && <MobileSection title="People"><div className="val-mobile-rows">{matchedPeople.map((person) => <form className="val-mobile-row" action={friendIds.has(person.id) ? "/api/private-messages" : "/api/friends/requests"} method="post" key={person.id}><input type="hidden" name={friendIds.has(person.id) ? "friendId" : "receiverId"} value={person.id} /><input type="hidden" name="redirectTo" value="/dashboard/friends" /><AvatarInitials imageUrl={person.image} value={person.name || person.email} /><span className="val-mobile-row-copy"><strong>{person.name || person.email}</strong><small>{person.email}</small></span><button className="val-mobile-icon-button" type="submit" aria-label={`${friendIds.has(person.id) ? "Message" : "Add friend"} ${person.name}`}><MobileIcon name={friendIds.has(person.id) ? "chat" : "plus"} /></button></form>)}</div>{!matchedPeople.length && <MobileEmpty>No people match this search.</MobileEmpty>}<Link className="val-mobile-row" href="/dashboard/friends?add=1">Find someone by email <MobileIcon name="next" /></Link></MobileSection>}
      {visible("Spaces") && <MobileSection title="Spaces"><div className="val-mobile-rows">{matchedGroups.map((group) => <RememberedSpaceLink key={group.id} group={group} className="val-mobile-row"><AvatarInitials fallback="group" imageUrl={group.image} value={group.name} /><span className="val-mobile-row-copy"><strong>{group.name}</strong><small>{group.members?.length ?? 0} members</small></span><MobileIcon name="next" /></RememberedSpaceLink>)}</div>{!matchedGroups.length && <MobileEmpty>No spaces match this search.</MobileEmpty>}</MobileSection>}
      {visible("Channels") && <MobileSection title="Channels"><div className="val-mobile-rows">{matchedChannels.map((channel) => <Link key={channel.id} className="val-mobile-row" href={`/dashboard/groups/${channel.group.id}/channels/${channel.id}`}><MobileIcon name={channel.type === "VOICE" ? "voice" : "chat"} /><span className="val-mobile-row-copy"><strong>{channel.type === "TEXT" ? "# " : ""}{channel.name}</strong><small>{channel.group.name} · {channel.type === "VOICE" ? "Voice" : "Text"}</small></span><MobileIcon name="next" /></Link>)}</div>{!matchedChannels.length && <MobileEmpty>No channels match this search.</MobileEmpty>}</MobileSection>}
      {visible("Messages") && <MobileSection title="Recent messages">{search.length < 2 ? <MobileEmpty>Enter at least two characters.</MobileEmpty> : error ? <p role="alert">{error}</p> : !decrypted ? <MobileEmpty>Opening encrypted messages…</MobileEmpty> : <><div className="val-mobile-rows">{decrypted.filter((message) => matchesSearch(search, message.content, message.sender.name)).map((message) => <Link key={message.id} className="val-mobile-row" href={`/dashboard/groups/${message.channel.group.id}/channels/${message.channel.id}#message-${message.id}`}><span className="val-mobile-row-copy"><strong>{message.sender.name} · #{message.channel.name}</strong><small>{message.content}</small></span><MobileIcon name="next" /></Link>)}</div>{!decrypted.some((message) => matchesSearch(search, message.content, message.sender.name)) && <MobileEmpty>No matching messages in your recent history.</MobileEmpty>}<p className="val-mobile-empty">Older history can be searched inside each conversation. Messages remain encrypted.</p></>}</MobileSection>}
    </>}
  </div></main>;
}
