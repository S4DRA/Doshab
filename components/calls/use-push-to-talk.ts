"use client";

import { useCallback, useEffect, useRef } from "react";
import type { MediaClient } from "@/lib/media/media-client";
import type { VoiceSettings } from "@/lib/voice-settings";
import { microphoneConstraints } from "./persistent-call-provider";

export function usePushToTalk(media: MediaClient | null, settings: VoiceSettings | undefined, onError: (message: string) => void) {
  const held = useRef(false);
  const enabled = settings?.inputMode === "push_to_talk";
  const release = useCallback(() => {
    if (!held.current) return;
    held.current = false;
    void media?.setMicMuted(true).catch((cause) => { console.warn("Push-to-talk release failed", cause); onError("Could not update your microphone state."); });
  }, [media, onError]);
  const press = useCallback(() => {
    if (!enabled || !media || held.current || media.snapshot().state !== "connected") return;
    held.current = true;
    void (async () => {
      await media.setMicMuted(false);
      if (!media.snapshot().local.some((item) => item.source === "mic")) await media.start("mic", microphoneConstraints(settings));
    })().catch((cause) => {
      console.warn("Push-to-talk unavailable", cause); release(); onError("Could not open your microphone. Check its permission and input device.");
    });
  }, [enabled, media, onError, release, settings]);
  useEffect(() => {
    if (!enabled) return;
    const key = settings?.pushToTalkKey?.trim().toLowerCase() || "space";
    const matches = (event: KeyboardEvent) => event.code.toLowerCase() === key || event.key.toLowerCase() === key;
    const down = (event: KeyboardEvent) => {
      if (event.repeat || !matches(event)) return;
      const element = event.target as HTMLElement | null;
      if (element?.closest("input,textarea,select,button,a,[contenteditable='true']")) return;
      event.preventDefault(); press();
    };
    const up = (event: KeyboardEvent) => { if (matches(event)) release(); };
    const hidden = () => { if (document.hidden) release(); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    window.addEventListener("pointerup", release); window.addEventListener("pointercancel", release); window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      window.removeEventListener("keydown", down); window.removeEventListener("keyup", up);
      window.removeEventListener("pointerup", release); window.removeEventListener("pointercancel", release); window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", hidden); release();
    };
  }, [enabled, settings?.pushToTalkKey, press, release]);
  return { enabled, press, release };
}
