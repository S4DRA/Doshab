"use client";

import { useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLinkStatus } from "next/link";
import { mobileLayoutQuery } from "@/lib/mobile-navigation";
import { ValLoadingScreen } from "@/components/brand/ValLoadingScreen";

const subscribe = (update: () => void) => {
  const media = window.matchMedia(mobileLayoutQuery);
  media.addEventListener("change", update);
  return () => media.removeEventListener("change", update);
};

/** Navigation owns the lifetime: fast transitions unmount before this timer fires. */
export function DelayedMobileLoading({ children, label = "Opening page" }: { children?: ReactNode; label?: string }) {
  const mobile = useSyncExternalStore(subscribe, () => window.matchMedia(mobileLayoutQuery).matches, () => false);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!mobile) return;
    const timer = window.setTimeout(() => setVisible(true), 150);
    return () => window.clearTimeout(timer);
  }, [mobile]);
  if (!mobile) return children;
  return visible ? <div className="val-mobile-route-loading" data-mobile-loading><ValLoadingScreen label={label} /></div>
    : <div className="val-mobile-loading-placeholder" aria-busy="true" />;
}

/** Covers the request phase before an uncached tab can reach its route fallback. */
export function MobileLinkPending() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return createPortal(<DelayedMobileLoading />, document.getElementById("val-app") ?? document.body);
}
