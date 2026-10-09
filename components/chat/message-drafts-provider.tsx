"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { createDraftStore } from "@/lib/message-drafts";
import { createMessageSendStore } from "@/lib/message-send";
const DraftContext = createContext<{
  drafts: ReturnType<typeof createDraftStore>;
  sends: ReturnType<typeof createMessageSendStore>;
} | null>(null);

/** Drafts survive route changes in this signed-in layout, without storing plaintext on disk. */
export function MessageDraftsProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(() => ({ drafts: createDraftStore(), sends: createMessageSendStore() }));
  useEffect(() => {
    store.sends.setActive(true);
    return () => store.sends.setActive(false);
  }, [store]);
  return <DraftContext.Provider value={store}>{children}</DraftContext.Provider>;
}

export function useMessageDraft(key: string): [string, Dispatch<SetStateAction<string>>] {
  const store = useContext(DraftContext);
  if (!store) throw new Error("Message drafts require MessageDraftsProvider.");
  const value = useSyncExternalStore(store.drafts.subscribe, () => store.drafts.get(key), () => "");
  return [value, (next) => store.drafts.set(key, next)];
}

/** Sends and replies share the existing dashboard lifetime with memory-only drafts. */
export function useMessageSend(key: string) {
  const store = useContext(DraftContext);
  if (!store) throw new Error("Message sends require MessageDraftsProvider.");
  const snapshot = useSyncExternalStore(store.sends.subscribe, () => store.sends.get(key), () => store.sends.get(key));
  return { ...store, snapshot };
}
