"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
export function useCallWakeLock(connected: boolean, onError: (message: string | null) => void) {
  const supported = useSyncExternalStore(subscribe, () => "wakeLock" in navigator, () => false);
  const [enabled, setEnabled] = useState(false);
  const [active, setActive] = useState(false);
  useEffect(() => {
    if (!connected || !enabled || !supported) return;
    let live = true;
    let pending = false;
    let sentinel: WakeLockSentinel | null = null;
    const released = () => { if (live) setActive(false); };
    const request = async () => {
      if (!live || pending || sentinel && !sentinel.released || document.visibilityState !== "visible") return;
      pending = true;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (!live) { await lock.release(); return; }
        sentinel = lock; sentinel.addEventListener("release", released); setActive(!lock.released);
      } catch (error) { console.warn("Screen wake lock unavailable", error); if (live) { setActive(false); onError("The screen cannot stay awake right now. Your call is still connected."); } }
      finally { pending = false; }
    };
    const visible = () => { if (document.visibilityState === "visible") void request(); };
    void request(); document.addEventListener("visibilitychange", visible);
    return () => { live = false; document.removeEventListener("visibilitychange", visible); sentinel?.removeEventListener("release", released); void sentinel?.release().catch((error) => console.warn("Screen wake lock cleanup failed", error)); };
  }, [connected, enabled, supported, onError]);
  return { supported, enabled, active: connected && enabled && active, setEnabled };
}
