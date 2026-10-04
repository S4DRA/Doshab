"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { mobileDestination, mobileLayoutQuery } from "@/lib/mobile-navigation";
import { MobileIcon } from "./mobile-ui";
import { LogoMark } from "@/components/ui/logo-mark";
import { MobileLinkPending } from "./mobile-page-loading";
import { mobileNavbarButtons, selectedMobileNavbarButton } from "@/lib/mobile-navbar";
import { useMobileNavbarPreferences } from "./mobile-navbar-preferences";

const subscribeNetwork = (update: () => void) => {
  window.addEventListener("online", update); window.addEventListener("offline", update);
  return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
};
const subscribeLayout = (update: () => void) => {
  const media = window.matchMedia(mobileLayoutQuery); media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
};
type RouteDestination = { path: string; destination: ReturnType<typeof mobileDestination> } | null;
const NavigationContext = createContext<{ route: RouteDestination; setRoute: Dispatch<SetStateAction<RouteDestination>> } | null>(null);
export function MobileNavigationProvider({ children }: { children: React.ReactNode }) {
  const [route, setRoute] = useState<RouteDestination>(null);
  return <NavigationContext.Provider value={{ route, setRoute }}>{children}</NavigationContext.Provider>;
}
export function useMobileRouteDestination(direct: boolean) {
  const path = usePathname();
  const setRoute = useContext(NavigationContext)?.setRoute;
  useEffect(() => { setRoute?.({ path, destination: direct ? "messages" : "groups" }); }, [path, direct, setRoute]);
}
export function useMobileLayout() {
  return useSyncExternalStore(subscribeLayout, () => window.matchMedia(mobileLayoutQuery).matches, () => false);
}

export function MobileShell({ image, name }: { image?: string | null; name: string }) {
  const profilePhoto = image?.trim();
  const [failedProfilePhoto, setFailedProfilePhoto] = useState<string | null>(null);
  const pathname = usePathname();
  const navigation = useContext(NavigationContext);
  const { preferences } = useMobileNavbarPreferences();
  const online = useSyncExternalStore(subscribeNetwork, () => navigator.onLine, () => true);
  const destination = navigation?.route?.path === pathname ? navigation.route.destination : mobileDestination(pathname);
  const conversation = /\/channels\/[^/]+$/.test(pathname) || pathname.startsWith("/dashboard/calls/");
  const settingsShortcut = !preferences.buttons.includes("profile");
  const selected = selectedMobileNavbarButton(pathname, destination, preferences.buttons);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    void navigator.serviceWorker.register("/push-sw.js").catch((error) => console.warn("Offline support could not start", error));
  }, []);
  return <>
    {(!conversation || settingsShortcut) && <header className="val-mobile-topbar val-mobile-only">
      <Link href="/dashboard" className="val-mobile-brand" aria-label="VAL Home"><LogoMark className="h-8 w-10" preload /><strong>VAL</strong><span>A more<br />human internet</span></Link>
      <div className="val-mobile-topbar-actions"><Link href="/dashboard/notifications" className="val-mobile-icon-button" data-tour-target="notifications-nav" aria-label="Notifications"><MobileIcon name="bell" /></Link>
        {settingsShortcut && <Link href="/dashboard/profile?view=settings" className="val-mobile-icon-button" aria-label="Settings"><MobileIcon name="settings" /><MobileLinkPending /></Link>}
      </div>
    </header>}
    {!online && <div className="val-network-notice" role="status">You’re offline. Messages will reconnect when you’re online.</div>}
    <nav className="val-mobile-nav val-mobile-only" data-position={preferences.position} data-floating={preferences.floating} data-empty={preferences.buttons.length === 0} data-tour-target="mobile-main-nav" aria-label="Main navigation">
      {preferences.buttons.map(id => {
        const { label, href, icon } = mobileNavbarButtons.find(button => button.id === id)!;
        return <Link key={id} href={href} data-tour-target={`${id}-nav`} aria-current={selected === id ? "page" : undefined}>
        {id === "profile" && profilePhoto && failedProfilePhoto !== profilePhoto
          ? <Image src={profilePhoto} alt="" width={26} height={26} unoptimized onError={() => setFailedProfilePhoto(profilePhoto)} />
          : <MobileIcon name={icon} />}
        <span>{label}</span>{id === "profile" && <span className="sr-only">{name}</span>}<MobileLinkPending />
      </Link>; })}
    </nav>
  </>;
}
