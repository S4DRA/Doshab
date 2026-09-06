"use client";

import { useSyncExternalStore } from "react";

type PlaybackState = { volume: number; muted: boolean; blocked: boolean; playbackError: string | null; localPaused: boolean; visible: boolean };
const initial: PlaybackState = { volume: 0.35, muted: false, blocked: false, playbackError: null, localPaused: false, visible: true };
let state = initial;
type PlaybackStatus = Pick<PlaybackState, "blocked" | "playbackError" | "localPaused" | "visible">;
const initialStatus: PlaybackStatus = { blocked: false, playbackError: null, localPaused: false, visible: true };
let status = initialStatus;
const listeners = new Set<() => void>();
let controller: { join: () => void; hide: () => void } | null = null;

export function setMusicPlaybackStatus(patch: Partial<PlaybackState>) {
  const next = { ...state, ...patch };
  if (Object.keys(next).every((key) => next[key as keyof PlaybackState] === state[key as keyof PlaybackState])) return;
  state = next;
  if (status.blocked !== next.blocked || status.playbackError !== next.playbackError || status.localPaused !== next.localPaused || status.visible !== next.visible) {
    status = { blocked: next.blocked, playbackError: next.playbackError, localPaused: next.localPaused, visible: next.visible };
  }
  listeners.forEach((notify) => notify());
}

export function initializeMusicVolume() {
  let saved: { volume?: unknown; muted?: unknown } | null = null;
  try { saved = JSON.parse(localStorage.getItem("val:music-volume:v1") ?? "null"); } catch { /* In-memory controls remain available. */ }
  setMusicPlaybackStatus({ ...initial, volume: typeof saved?.volume === "number" && Number.isFinite(saved.volume) ? Math.max(0, Math.min(1, saved.volume)) : 0.35, muted: saved?.muted === true });
}

export function registerMusicPlaybackController(value: typeof controller) { controller = value; }
const subscribe = (notify: () => void) => { listeners.add(notify); return () => { listeners.delete(notify); }; };
function save(patch: Partial<PlaybackState>) {
  setMusicPlaybackStatus(patch);
  try { localStorage.setItem("val:music-volume:v1", JSON.stringify({ volume: state.volume, muted: state.muted })); } catch { /* Volume still works without storage. */ }
}
const join = () => controller?.join();
const hide = () => controller?.hide();

// Volume slider movement should update the audio control, not the popup/queue/search tree.
export function useMusicStatus() {
  const snapshot = useSyncExternalStore(subscribe, () => status, () => initialStatus);
  return { ...snapshot, join, hide };
}

export function useMusicVolume() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  return { ...snapshot,
    setVolume: (volume: number) => { if (Number.isFinite(volume)) save({ volume: Math.min(1, Math.max(0, volume)) }); },
    setMuted: (muted: boolean) => save({ muted }),
    join, hide,
  };
}
