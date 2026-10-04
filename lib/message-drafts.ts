type DraftUpdate = string | ((previous: string) => string);

/** Account/channel keys live only for the lifetime of the signed-in dashboard. */
export function createDraftStore(limit = 80) {
  const drafts = new Map<string, string>();
  const listeners = new Set<() => void>();
  return {
    get: (key: string) => drafts.get(key) ?? "",
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
    set: (key: string, value: DraftUpdate) => {
      const previous = drafts.get(key) ?? "";
      const next = typeof value === "function" ? value(previous) : value;
      if (next === previous) return;
      drafts.delete(key);
      if (next) drafts.set(key, next);
      if (drafts.size > limit) drafts.delete(drafts.keys().next().value!);
      listeners.forEach((listener) => listener());
    },
  };
}
