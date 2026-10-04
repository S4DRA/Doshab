"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileSettingsPanel } from "@/components/profile/profile-settings-panel";
import { formatUserStatus } from "@/lib/utils";
import type { UserStatus } from "@/types";
import { MobileHeading, MobileIcon, MobileSection } from "./mobile-ui";
import { useMobileLayout } from "./mobile-shell";

const subscribeHash = (update: () => void) => { window.addEventListener("hashchange", update); window.addEventListener("popstate", update); return () => { window.removeEventListener("hashchange", update); window.removeEventListener("popstate", update); }; };

export function MobileProfile({ user, view }: { user: { name: string; email: string; image: string | null; status: UserStatus }; view?: string }) {
  const mobile = useMobileLayout();
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  if (!mobile) return null;
  const settings = view === "settings" || ["#profile", "#voice", "#notifications", "#security", "#account", "#navigation"].includes(hash);
  return <div className="val-mobile-only val-mobile-page val-mobile-profile">
    {view === "edit" ? <><MobileHeading title="Edit profile" back="/dashboard/profile" /><ProfileForm user={user} /></> : settings ? <><MobileHeading title="Settings" back="/dashboard/profile" /><div className="val-mobile-settings"><ProfileSettingsPanel mobile /></div></> : <>
      <section className="val-mobile-section val-mobile-profile-card"><AvatarInitials imageUrl={user.image} value={user.name} size="lg" /><h1>{user.name}</h1><p>{user.email}</p><small>{formatUserStatus(user.status)}</small><Link className="val-mobile-text-button" href="/dashboard/profile?view=edit">Edit profile</Link></section>
      <MobileSection title="Your connections"><div className="val-mobile-profile-links">{([[
        "Messages", "/dashboard/messages", "chat"], ["Friends & requests", "/dashboard/friends", "friends"], ["Search", "/dashboard/search", "search"], ["Notifications", "/dashboard/notifications", "bell"], ["Your spaces", "/dashboard/channels", "groups"],
      ] as const).map(([label, href, icon]) => <Link className="val-mobile-row" href={href} key={href}><MobileIcon name={icon} /><strong className="val-mobile-row-copy">{label}</strong><MobileIcon name="next" /></Link>)}</div></MobileSection>
      <Link className="val-mobile-row" href="/dashboard/profile?view=settings">Settings <MobileIcon name="next" /></Link>
    </>}
  </div>;
}
