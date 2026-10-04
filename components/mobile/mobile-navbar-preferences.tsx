"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { defaultMobileNavbar, mobileNavbarKey, normalizeMobileNavbar, type MobileNavbarPreferences } from "@/lib/mobile-navbar";

type NavbarContext = {
  preferences: MobileNavbarPreferences;
  ready: boolean;
  error: string | null;
  update: (next: MobileNavbarPreferences) => void;
};
const Context = createContext<NavbarContext | null>(null);

export function MobileNavbarPreferencesProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const [preferences, setPreferences] = useState(defaultMobileNavbar);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const read = () => {
      try {
        const stored = localStorage.getItem(mobileNavbarKey(userId));
        setPreferences(normalizeMobileNavbar(stored ? JSON.parse(stored) : null));
        setError(null);
      } catch (cause) {
        console.warn("Mobile navbar preferences could not be read", cause);
        setError("Your saved navbar could not be read. Restore the default or choose your layout again.");
      }
      setReady(true);
    };
    const frame = requestAnimationFrame(read);
    const onStorage = (event: StorageEvent) => {
      if (event.key === mobileNavbarKey(userId) || event.key === null) read();
    };
    window.addEventListener("storage", onStorage);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("storage", onStorage); };
  }, [userId]);
  const update = (next: MobileNavbarPreferences) => {
    const normalized = normalizeMobileNavbar(next);
    setPreferences(normalized);
    try {
      localStorage.setItem(mobileNavbarKey(userId), JSON.stringify(normalized));
      setError(null);
    } catch (cause) {
      console.warn("Mobile navbar preferences could not be saved", cause);
      setError("This navbar is active for this session. Your browser could not save it on this device.");
    }
  };
  return <Context.Provider value={{ preferences, ready, error, update }}>{children}</Context.Provider>;
}

export function useMobileNavbarPreferences() {
  const context = useContext(Context);
  if (!context) throw new Error("Mobile navbar preferences require the signed-in dashboard provider.");
  return context;
}
