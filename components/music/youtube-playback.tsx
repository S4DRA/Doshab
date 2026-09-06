"use client";

import { useEffect, useRef, useState } from "react";
import { expectedPosition } from "@/lib/music/types";
import { loadYouTubePlayer, type YouTubePlayer } from "@/lib/music/youtube-player";
import { useMusicSession } from "./music-session-provider";
import { initializeMusicVolume, registerMusicPlaybackController, setMusicPlaybackStatus, useMusicVolume } from "./music-volume";

export function YouTubePlayback() {
  const music = useMusicSession()!;
  const track = music.session?.track;
  return track ? <ActiveYouTubePlayback /> : null;
}

function ActiveYouTubePlayback() {
  const music = useMusicSession()!;
  const audio = useMusicVolume();
  const container = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLElement>(null);
  const player = useRef<YouTubePlayer | null>(null);
  const ready = useRef(false);
  const latest = useRef({ music, audio });
  const syncRef = useRef<(force?: boolean) => void>(() => {});
  const localSeekHold = useRef(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => { latest.current = { music, audio }; }, [music, audio]);
  useEffect(() => {
    let cancelled = false;
    let loadedTrack = "";
    let expectedState = -1;
    let programmaticUntil = 0;
    let lastPosition: number | null = null;
    let lastSample = 0;
    let lastAnchor = "";
    let lastEnded = "";
    let inView = true;
    initializeMusicVolume();

    const pause = () => {
      lastPosition = null;
      if (ready.current) { programmaticUntil = performance.now() + 1200; expectedState = 2; player.current?.pauseVideo(); }
    };
    const sync = (force = false) => {
      const p = player.current;
      const { session, clockOffset, reconnecting } = latest.current.music;
      const local = latest.current.audio;
      if (!ready.current || !p || !session?.track) return;
      if (document.visibilityState !== "visible" || !local.visible || !inView || reconnecting) { pause(); return; }
      const target = expectedPosition(session, Date.now() + clockOffset);
      const queueId = session.track.queueId;
      const anchor = `${queueId}:${session.state}:${session.position}:${session.startedAt}`;
      const changed = lastAnchor !== anchor;
      lastAnchor = anchor;
      if (loadedTrack !== queueId) {
        loadedTrack = queueId; localSeekHold.current = false; lastPosition = null;
        setMusicPlaybackStatus({ playbackError: null, blocked: false, localPaused: false });
        programmaticUntil = performance.now() + 1500;
        p.cueVideoById({ videoId: session.track.id, startSeconds: target });
        return;
      }
      if (local.playbackError || (local.localPaused && !force && !changed) || (local.blocked && !force)) return;
      // Respect native YouTube controls. Shared commands or an explicit Join resynchronize local overrides.
      if (changed || force) { localSeekHold.current = false; setMusicPlaybackStatus({ localPaused: false }); }
      if (session.state !== "PLAYING") {
        pause();
        if (changed || force) p.seekTo(target, true);
        return;
      }
      const state = p.getPlayerState();
      const position = p.getCurrentTime();
      const sampleTime = performance.now();
      if (!changed && !force && state === 1 && lastPosition !== null && sampleTime > programmaticUntil &&
          Math.abs(position - lastPosition - (sampleTime - lastSample) / 1000) > 2) {
        localSeekHold.current = true;
        setMusicPlaybackStatus({ localPaused: true });
      }
      lastPosition = position; lastSample = sampleTime;
      if (localSeekHold.current && !force && !changed) return;
      // Buffering/unstarted states (including provider-managed ads) are left to YouTube.
      const durationMatches = Math.abs(p.getDuration() - session.track.duration) < 2;
      if ((force || changed || state === 1) && durationMatches && Math.abs(position - target) > 0.5) {
        programmaticUntil = sampleTime + 1200;
        p.seekTo(target, true); lastPosition = target;
      }
      if (state === 2 || state === 5 || force) {
        if (durationMatches && Math.abs(position - target) > 0.5) { p.seekTo(target, true); lastPosition = target; }
        programmaticUntil = sampleTime + 1200; expectedState = 1; p.playVideo();
      }
    };
    syncRef.current = sync;
    registerMusicPlaybackController({
      join: () => {
        setMusicPlaybackStatus({ visible: true, blocked: false, playbackError: null, localPaused: false });
        latest.current.audio = { ...latest.current.audio, visible: true, blocked: false, playbackError: null, localPaused: false };
        localSeekHold.current = false;
        // Keep the user gesture when the embedded player is already visible.
        if (dock.current && !dock.current.hidden) sync(true);
      },
      hide: () => { pause(); setMusicPlaybackStatus({ visible: false, localPaused: true }); },
    });

    const mount = async () => {
      try {
        const api = await loadYouTubePlayer();
        if (cancelled || !container.current) return;
        const element = document.createElement("div");
        container.current.appendChild(element);
        player.current = new api.Player(element, { width: "100%", height: "100%",
          playerVars: { origin: window.location.origin, playsinline: 1, controls: 1, autoplay: 0, rel: 0 },
          events: {
            onReady: ({ target }) => {
              if (cancelled) return;
              ready.current = true;
              target.getIframe().title = "YouTube music player";
              target.getIframe().referrerPolicy = "strict-origin-when-cross-origin";
              target.setVolume(latest.current.audio.volume * 100);
              if (latest.current.audio.muted) target.mute(); else target.unMute();
              sync();
            },
            onAutoplayBlocked: () => { if (!cancelled) setMusicPlaybackStatus({ blocked: true }); },
            onError: ({ data }) => {
              if (!cancelled) setMusicPlaybackStatus({ playbackError: data === 153 ? "YouTube could not verify this player. Check the site's referrer policy." : "This track cannot be played here. Try another YouTube music video." });
            },
            onStateChange: ({ data }) => {
              if (cancelled) return;
              if (data === 5) { sync(); return; }
              if (data === 1) {
                setMusicPlaybackStatus({ blocked: false });
                if (expectedState !== 1 && performance.now() > programmaticUntil) {
                  localSeekHold.current = true;
                  setMusicPlaybackStatus({ localPaused: true });
                }
              }
              if (data === 2 && expectedState !== 2 && performance.now() > programmaticUntil) {
                setMusicPlaybackStatus({ localPaused: true });
              }
              if (data === 0) {
                const { session, command } = latest.current.music;
                const key = `${session?.track?.queueId}:${session?.version}`;
                if (session?.track && key !== lastEnded && !localSeekHold.current) { lastEnded = key; void command({ type: "ended" }); }
              }
            },
          },
        });
      } catch (error) { if (!cancelled) setMusicPlaybackStatus({ playbackError: error instanceof Error ? error.message : "YouTube player is unavailable." }); }
    };
    void mount();
    let timer: ReturnType<typeof setInterval> | undefined;
    const schedule = () => {
      clearInterval(timer); timer = undefined;
      if (document.visibilityState === "visible" && inView) timer = setInterval(() => sync(), 3000);
    };
    const visibility = () => { schedule(); if (document.visibilityState !== "visible") pause(); else sync(!latest.current.audio.localPaused); };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      schedule(); if (!inView) pause(); else sync();
    }, { threshold: [0,0.5,1] });
    if (dock.current) observer.observe(dock.current);
    document.addEventListener("visibilitychange", visibility);
    schedule();
    return () => {
      cancelled = true; clearInterval(timer); observer.disconnect(); document.removeEventListener("visibilitychange", visibility);
      registerMusicPlaybackController(null); pause(); ready.current = false; player.current?.destroy(); player.current = null;
      setMusicPlaybackStatus({ visible: true, blocked: false, playbackError: null, localPaused: false });
    };
  }, [attempt]);

  useEffect(() => { syncRef.current(); }, [music.session, music.reconnecting, audio.visible]);
  useEffect(() => {
    if (!ready.current || !player.current) return;
    player.current.setVolume(audio.volume * 100);
    if (audio.muted) player.current.mute(); else player.current.unMute();
  }, [audio.volume, audio.muted]);

  return <section ref={dock} className="music-youtube-inline" aria-label="YouTube room music">
    <div className="music-youtube-video" ref={container} />
    {(audio.blocked || audio.localPaused) && <button type="button" className="music-youtube-join" onClick={audio.join}>{audio.blocked ? "Click to join the music" : "Rejoin synchronized music"}</button>}
    {audio.playbackError && <div role="alert" className="music-error">{audio.playbackError}<button type="button" className="music-youtube-join" onClick={() => setAttempt((value) => value + 1)}>Retry player</button></div>}
  </section>;
}
