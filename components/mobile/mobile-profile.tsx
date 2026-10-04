"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSyncExternalStore, type MouseEvent } from "react";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileSettingsPanel } from "@/components/profile/profile-settings-panel";
import { formatUserStatus } from "@/lib/utils";
import type { UserStatus } from "@/types";
import { MobileHeading, MobileIcon, MobileSection } from "./mobile-ui";
import { useMobileLayout } from "./mobile-shell";

const subscribeHash = (update: () => void) => { window.addEventListener("hashchange", update); window.addEventListener("popstate", update); return () => { window.removeEventListener("hashchange", update); window.removeEventListener("popstate", update); }; };

export function MobileProfile({ user }: { user: { name: string; email: string; image: string | null; status: UserStatus } }) {
  const mobile = useMobileLayout();
  const view = useSearchParams().get("view");
  const hash = useSyncExternalStore(subscribeHash, () => window.location.hash, () => "");
  const openView = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    // These views already have the authenticated user; native history keeps Next's
    // search parameters and Back/Forward in sync without another server request.
    window.history.pushState(null, "", event.currentTarget.href);
  };
  if (!mobile) return null;
  const settings = view === "settings" || ["#profile", "#voice", "#notifications", "#security", "#account", "#navigation"].includes(hash);
  return <div className="val-mobile-only val-mobile-page val-mobile-profile">
    {view === "edit" ? <><MobileHeading title="Edit profile" back="/dashboard/profile" onBack={openView} /><ProfileForm user={user} /></> : settings ? <><MobileHeading title="Settings" back="/dashboard/profile" onBack={openView} /><div className="val-mobile-settings"><ProfileSettingsPanel mobile /></div></> : <>
      <section className="val-mobile-section val-mobile-profile-card"><AvatarInitials imageUrl={user.image} value={user.name} size="lg" /><h1>{user.name}</h1><p>{user.email}</p><small>{formatUserStatus(user.status)}</small><Link className="val-mobile-text-button" href="/dashboard/profile?view=edit" onClick={openView}>Edit profile</Link></section>
      <MobileSection title="Your connections"><div className="val-mobile-profile-links">{([[
        "Messages", "/dashboard/messages", "chat"], ["Friends & requests", "/dashboard/friends", "friends"], ["Search", "/dashboard/search", "search"], ["Notifications", "/dashboard/notifications", "bell"], ["Your spaces", "/dashboard/channels", "groups"],
      ] as const).map(([label, href, icon]) => <Link className="val-mobile-row" href={href} key={href}><MobileIcon name={icon} /><strong className="val-mobile-row-copy">{label}</strong><MobileIcon name="next" /></Link>)}</div></MobileSection>
      <Link className="val-mobile-row" href="/dashboard/profile?view=settings" onClick={openView}>Settings <MobileIcon name="next" /></Link>
    </>}
  </div>;
}
