export const intentDelayMs = { pointer: 150, focus: 80 };

/** No calls, action flags, external destinations, or account endpoints are speculative. */
export function preparationHref(value: string): string | null {
  if (!value.startsWith("/dashboard") || value.startsWith("//")) return null;
  const url = new URL(value, "https://val.invalid");
  if (url.origin !== "https://val.invalid" || url.hash) return null;
  if ([...url.searchParams].some(([key, val]) => key !== "view" || !["settings", "edit", "messages"].includes(val))) return null;
  if (!/^\/dashboard(?:\/(?:messages|friends|channels|profile|search|notifications)|\/groups\/[^/]+(?:\/channels\/[^/]+|\/settings)?)?$/.test(url.pathname)) return null;
  return `${url.pathname}${url.search}`;
}

export function preparationAllowed(state: { hidden: boolean; online: boolean; gameSafe: boolean; mediaActive: boolean; saveData?: boolean; effectiveType?: string }) {
  return !state.hidden && state.online && !state.gameSafe && !state.mediaActive && !state.saveData && !["slow-2g", "2g", "3g"].includes(state.effectiveType ?? "");
}

type Options = {
  prefetch: (href: string, options: { onInvalidate: () => void }) => void;
  allowed: () => boolean;
  current: () => string;
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>;
  cancel?: (timer: ReturnType<typeof setTimeout>) => void;
  now?: () => number;
};

/** Next owns data/cache/transport. Reserve one speculative destination until it is
 * visited or Next invalidates it; a timer cannot prove that a request finished. */
export function createNavigationPreparation({ prefetch, allowed, current, schedule = setTimeout, cancel = clearTimeout, now = Date.now }: Options) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let reserved: string | null = null;
  let disposed = false;
  let windowStart = now();
  let issuedInWindow = 0;
  const prepared = new Set<string>();
  const metrics = { intents: 0, issued: 0, reused: 0, suppressed: 0, cancelled: 0, useful: 0, invalidatedUnused: 0, errors: 0 };
  const clear = () => { if (timer !== undefined) { cancel(timer); timer = undefined; metrics.cancelled++; } };
  return {
    intent(value: string, kind: keyof typeof intentDelayMs) {
      clear();
      const href = preparationHref(value);
      metrics.intents++;
      if (!href || href === current() || !allowed() || disposed) { metrics.suppressed++; return () => {}; }
      const token = schedule(() => {
        timer = undefined;
        if (disposed || !allowed()) { metrics.suppressed++; return; }
        if (prepared.has(href)) { metrics.reused++; return; }
        if (now() - windowStart >= 60_000) { windowStart = now(); issuedInWindow = 0; }
        if (reserved || issuedInWindow >= 4) { metrics.suppressed++; return; }
        reserved = href; prepared.add(href); issuedInWindow++; metrics.issued++;
        try {
          prefetch(href, { onInvalidate: () => {
            if (prepared.delete(href)) metrics.invalidatedUnused++;
            if (reserved === href) reserved = null;
          } });
        } catch { prepared.delete(href); reserved = null; metrics.errors++; }
      }, intentDelayMs[kind]);
      timer = token;
      return () => { if (timer === token) clear(); };
    },
    cancel: clear,
    visit(href: string) { clear(); if (prepared.delete(href)) metrics.useful++; if (reserved === href) reserved = null; },
    snapshot: () => ({ ...metrics, reserved: reserved ? 1 : 0, retained: prepared.size }),
    dispose() { clear(); disposed = true; prepared.clear(); reserved = null; },
  };
}

export type ConversationPosition = { top: number; following: boolean; anchorId?: string; anchorOffset?: number; latestId?: string };
export function createConversationPositions(limit = 80) {
  const entries = new Map<string, ConversationPosition>();
  return {
    get: (key: string) => entries.get(key),
    set(key: string, value: ConversationPosition) {
      entries.delete(key); entries.set(key, value);
      if (entries.size > limit) entries.delete(entries.keys().next().value!);
    },
    clear: () => entries.clear(),
    get size() { return entries.size; },
  };
}
