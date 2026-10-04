"use client";

import Link from "next/link";
import { useState } from "react";
import { matchesSearch } from "@/lib/mobile-navigation";
import type { DashboardGroup } from "@/types";
import { MobileSpaceCards } from "./mobile-home";
import { MobileEmpty, MobileHeading, MobileIcon, MobileSection } from "./mobile-ui";
import { useMobileLayout } from "./mobile-shell";

export function MobileGroups({ groups, invitations }: { groups: DashboardGroup[]; invitations?: React.ReactNode }) {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("spaces");
  const mobile = useMobileLayout();
  const filtered = groups.filter((group) => matchesSearch(query, group.name, group.description));
  if (!mobile) return null;
  return <div className="val-mobile-only val-mobile-page">
    <MobileHeading title="Your spaces" action={<Link className="val-mobile-icon-button" href="/dashboard/create" aria-label="Create space"><MobileIcon name="plus" /></Link>} />
    <label className="val-mobile-search"><MobileIcon name="search" /><input aria-label="Search your spaces" placeholder="Search your spaces" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    <div className="val-mobile-tabs" aria-label="Space views"><button type="button" aria-pressed={tab === "spaces"} onClick={() => setTab("spaces")}>Joined spaces</button><button type="button" aria-pressed={tab === "invitations"} onClick={() => setTab("invitations")}>Invitations</button></div>
    {tab === "spaces" ? <MobileSection title="Your communities">{filtered.length || !groups.length ? <MobileSpaceCards groups={filtered} /> : <MobileEmpty>No spaces match “{query}”.</MobileEmpty>}</MobileSection> : <MobileSection title="Discover through invitations"><p className="val-mobile-empty">VAL spaces are invitation-based. New invitations appear here.</p>{invitations ?? <Link className="val-mobile-row" href="/dashboard#requests-and-invites">View invitations <MobileIcon name="next" /></Link>}</MobileSection>}
  </div>;
}
