import type { InteractionPreferences } from "./types";

const query = "(prefers-reduced-motion: reduce)";

export function readInteractionPreferences(): InteractionPreferences {
  return { reducedMotion: typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false };
}

/** Subscribe only when needed; no global store, provider or retained browser listener. */
export function subscribeInteractionPreferences(listener: (preferences: InteractionPreferences) => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(query);
  const onChange = () => listener({ reducedMotion: media.matches });
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}
