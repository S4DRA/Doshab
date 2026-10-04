"use client";

import { createContext, useContext, useState, useSyncExternalStore, type Dispatch, type SetStateAction } from "react";
import { createDraftStore } from "@/lib/message-drafts";
const DraftContext = createContext<ReturnType<typeof createDraftStore> | null>(null);

/** Drafts survive route changes in this signed-in layout, without storing plaintext on disk. */
export function MessageDraftsProvider({ children }: { children: React.ReactNode }) {
  const [store] = useState(createDraftStore);
  return <DraftContext.Provider value={store}>{children}</DraftContext.Provider>;
}

export function useMessageDraft(key: string): [string, Dispatch<SetStateAction<string>>] {
  const store = useContext(DraftContext);
  if (!store) throw new Error("Message drafts require MessageDraftsProvider.");
  const value = useSyncExternalStore(store.subscribe, () => store.get(key), () => "");
  return [value, (next) => store.set(key, next)];
}
