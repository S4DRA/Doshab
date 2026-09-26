"use client";

import { useEffect, useRef, useState } from "react";

type AudioTrack = { track: MediaStreamTrack; userId: string; local: boolean };

/** Measures actual media, draws outside React, and only publishes speaking transitions. */
export function useCallActivity(tracks: AudioTrack[], connected: boolean, deafened: boolean) {
  const localCanvas = useRef<HTMLCanvasElement>(null);
  const roomCanvas = useRef<HTMLCanvasElement>(null);
  const [speakingIds, setSpeakingIds] = useState<string[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let frame = 0;
    let context: AudioContext | null = null;
    const meters: { source: MediaStreamAudioSourceNode; analyser: AnalyserNode; samples: Uint8Array<ArrayBuffer>; spectrum: Uint8Array<ArrayBuffer>; entry: AudioTrack; lastActive: number }[] = [];
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let previousSpeaking: string | null = null;
    let previousFrame = 0;
    function draw(canvas: HTMLCanvasElement | null, values: number[], muted: boolean) {
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < 64; i++) {
        const level = muted ? 0 : values[i] ?? 0;
        const height = reducedMotion.matches ? 3 : Math.max(2, level / 255 * 36);
        ctx.fillStyle = level > 16 && !muted ? "#ff5a1f" : "#777a75";
        ctx.fillRect(i * 10, (40 - height) / 2, 4, height);
      }
    }
    function tick(now: number) {
      frame = requestAnimationFrame(tick);
      if (now - previousFrame < 100 || document.hidden) return;
      previousFrame = now;
      const localValues = Array<number>(64).fill(0);
      const roomValues = Array<number>(64).fill(0);
      const active = new Set<string>();
      for (const meter of meters) {
        const { entry, analyser } = meter;
        if (!connected || !entry.track.enabled || entry.track.muted || entry.track.readyState !== "live" || (!entry.local && deafened)) continue;
        analyser.getByteTimeDomainData(meter.samples);
        analyser.getByteFrequencyData(meter.spectrum);
        let energy = 0;
        for (const sample of meter.samples) energy += ((sample - 128) / 128) ** 2;
        const rms = Math.sqrt(energy / meter.samples.length);
        if (rms > 0.025) meter.lastActive = now;
        if (now - meter.lastActive < 400) active.add(entry.userId);
        const output = entry.local ? localValues : roomValues;
        for (let i = 0; i < output.length; i++) output[i] = Math.max(output[i], meter.spectrum[i]);
      }
      draw(localCanvas.current, localValues, !connected);
      draw(roomCanvas.current, roomValues, !connected || deafened);
      const next = [...active].sort().join(",");
      if (next !== previousSpeaking) { previousSpeaking = next; setSpeakingIds([...active]); }
    }
    if (tracks.length && connected) {
      try {
        context = new AudioContext();
        for (const entry of tracks) {
          if (entry.track.readyState !== "live") continue;
          const source = context.createMediaStreamSource(new MediaStream([entry.track]));
          const analyser = context.createAnalyser(); analyser.fftSize = 256; analyser.smoothingTimeConstant = 0.6;
          source.connect(analyser);
          meters.push({ source, analyser, entry, samples: new Uint8Array(analyser.fftSize), spectrum: new Uint8Array(analyser.frequencyBinCount), lastActive: -Infinity });
        }
      } catch (cause) { console.warn("Audio visualization unavailable", cause); queueMicrotask(() => setUnavailable(true)); }
    }
    const resume = () => { if (context?.state === "suspended") void context.resume().catch((cause) => { console.warn("Audio analyser could not resume", cause); setUnavailable(true); }); };
    resume(); document.addEventListener("pointerdown", resume);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); document.removeEventListener("pointerdown", resume);
      for (const meter of meters) { meter.source.disconnect(); meter.analyser.disconnect(); }
      if (context && context.state !== "closed") void context.close().catch((cause) => console.warn("Audio analyser cleanup failed", cause));
      // Never stop tracks: the persistent session owns them.
    };
  }, [tracks, connected, deafened]);
  return { localCanvas, roomCanvas, speakingIds: connected ? speakingIds : [], unavailable };
}
