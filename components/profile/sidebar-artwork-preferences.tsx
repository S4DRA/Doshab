"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { useDashboardPeople } from "@/components/layout/dashboard-people-provider";
import { readSidebarArtwork, sidebarArtworkCssImage, sidebarArtworkKey, type SidebarArtworkSlot } from "@/lib/sidebar-artwork";

const changeEvent = "val:sidebar-artwork-change";
const unavailableSnapshot = "storage-unavailable";

export function useSidebarArtworkPreferences() {
  const { currentUserId } = useDashboardPeople();
  const storageKey = sidebarArtworkKey(currentUserId);
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === storageKey || event.key === null) notify();
    };
    const onChange = (event: Event) => {
      if ((event as CustomEvent<string>).detail === storageKey) notify();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener(changeEvent, onChange);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(changeEvent, onChange);
    };
  }, [storageKey]);
  const getSnapshot = useCallback(() => {
    try { return window.localStorage.getItem(storageKey) ?? ""; }
    catch { return unavailableSnapshot; }
  }, [storageKey]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => null);
  const { images, error } = useMemo(() => snapshot === unavailableSnapshot
    ? { ...readSidebarArtwork(null), error: "Your browser could not read saved images on this device." }
    : readSidebarArtwork(snapshot), [snapshot]);

  function update(slot: SidebarArtworkSlot, image: string | null): string | null {
    try {
      const current = readSidebarArtwork(window.localStorage.getItem(storageKey)).images;
      window.localStorage.setItem(storageKey, JSON.stringify({ ...current, [slot]: image }));
      window.dispatchEvent(new CustomEvent(changeEvent, { detail: storageKey }));
      return null;
    } catch {
      return "Your browser could not save this image. The current image has been kept.";
    }
  }
  return { images, error, ready: snapshot !== null, update };
}

/** Applies personal artwork without wrapping or remounting persistent owners. */
export function SidebarArtworkPreferences() {
  const { images } = useSidebarArtworkPreferences();
  useEffect(() => {
    const app = document.getElementById("val-app");
    if (!app) return;
    for (const [slot, image] of Object.entries(images)) {
      const property = `--val-${slot}-artwork`;
      if (image) app.style.setProperty(property, sidebarArtworkCssImage(image));
      else app.style.removeProperty(property);
    }
    return () => {
      app.style.removeProperty("--val-navigation-artwork");
      app.style.removeProperty("--val-people-artwork");
    };
  }, [images]);
  return null;
}
