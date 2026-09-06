"use client";

import { useRoomContext } from "@livekit/components-react";
import { ConnectionState, RoomEvent } from "livekit-client";
import { Component, createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { type MusicCommand, type MusicSession } from "@/lib/music/types";
import { coalesceMusicRefresh } from "@/lib/music/refresh";
import { musicSessionFromMetadata } from "@/lib/music/metadata";
export { useMusicVolume } from "./music-volume";

type Snapshot = { session: MusicSession; serverTime: number; serverReceivedAt: number; source: string | null };
type MusicContextValue = {
  channelId: string; session: MusicSession | null; source: string | null; clockOffset: number;
  isDJ: boolean; canStart: boolean; busy: boolean; error: string | null; reconnecting: boolean;
  command: (command: MusicCommand) => Promise<boolean>;
  refreshNow: () => void;
};
const MusicContext = createContext<MusicContextValue | null>(null);
export function useMusicSession() { return useContext(MusicContext); }

export class MusicErrorBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error("Music interface failed", { name: error.name }); }
  render() { return this.state.failed ? <span className="music-error" role="status">Music is unavailable. Voice is still connected.</span> : this.props.children; }
}

export function MusicSessionProvider({ channelId, children }: { channelId: string | null; children: React.ReactNode }) {
  return channelId ? <ActiveMusicSession key={channelId} channelId={channelId}>{children}</ActiveMusicSession> : children;
}

function ActiveMusicSession({ channelId, children }: { channelId: string; children: React.ReactNode }) {
  const room = useRoomContext();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [clockOffset, setClockOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [reconnecting, setReconnecting] = useState(true);
  const [busy, setBusy] = useState(false);
  const current = useRef<Snapshot | null>(null);
  const refreshTrigger = useRef<() => void>(() => {});
  const offset = useRef(0);
  const commandBusy = useRef(false);
  const alive = useRef(true);
  const requestController = useRef<AbortController | null>(null);
  const endpoint = `/api/music/${encodeURIComponent(channelId)}`;

  const accept = useCallback((data: Snapshot, started: number) => {
    if (!alive.current) return;
    const old = current.current;
    if (old && old.session.roomId !== data.session.roomId && old.serverTime > data.serverTime) return;
    if (old && old.session.roomId === data.session.roomId && old.session.version > data.session.version) return;
    current.current = data;
    offset.current = ((data.serverReceivedAt - started) + (data.serverTime - Date.now())) / 2;
    setClockOffset((previous) => Math.abs(previous - offset.current) > 25 ? offset.current : previous);
    setSnapshot((previous) => previous?.session.roomId === data.session.roomId && previous.session.version === data.session.version ? previous : data);
    setReconnecting(false);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    if (room.state !== ConnectionState.Connected) return;
    const started = Date.now();
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Reconnecting to room music…");
      accept(data, started);
    } catch (failure) {
      if (alive.current && !controller.signal.aborted) {
        setReconnecting(true);
        setError(failure instanceof Error ? failure.message : "Reconnecting to room music…");
      }
    }
  }, [accept, endpoint, room]);

  useEffect(() => {
    alive.current = true;
    const coordinator = coalesceMusicRefresh(refresh);
    const update = () => { void coordinator.run(); };
    refreshTrigger.current = update;
    const metadataChanged = (raw: string) => {
      const session = musicSessionFromMetadata(raw);
      if (!session) { update(); return; }
      const previous = current.current;
      if (!previous) { update(); return; } // Establish server clock alignment once before consuming events.
      if (previous.session.roomId === session.roomId && previous.session.version >= session.version) return;
      const data = { ...previous, session, source: session.track ? `https://www.youtube.com/embed/${encodeURIComponent(session.track.id)}` : null };
      current.current = data;
      setSnapshot(data);
    };
    const disconnected = () => { setReconnecting(true); };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible" && (!current.current || current.current.session.track)) update();
    }, 60000);
    const initial = window.setTimeout(update, 0);
    room.on(RoomEvent.Connected, update).on(RoomEvent.Reconnected, update)
      .on(RoomEvent.RoomMetadataChanged, metadataChanged).on(RoomEvent.ParticipantDisconnected, update)
      .on(RoomEvent.Reconnecting, disconnected).on(RoomEvent.Disconnected, disconnected);
    const visible = () => { if (document.visibilityState === "visible") update(); };
    document.addEventListener("visibilitychange", visible);
    window.addEventListener("online", update);
    return () => {
      alive.current = false;
      coordinator.dispose(); refreshTrigger.current = () => {};
      requestController.current?.abort();
      clearInterval(timer); clearTimeout(initial);
      room.off(RoomEvent.Connected, update).off(RoomEvent.Reconnected, update)
        .off(RoomEvent.RoomMetadataChanged, metadataChanged).off(RoomEvent.ParticipantDisconnected, update)
        .off(RoomEvent.Reconnecting, disconnected).off(RoomEvent.Disconnected, disconnected);
      document.removeEventListener("visibilitychange", visible); window.removeEventListener("online", update);
    };
  }, [refresh, room]);

  const command = useCallback(async (action: MusicCommand) => {
    const state = current.current?.session;
    if (!state || commandBusy.current || room.state !== ConnectionState.Connected) return false;
    commandBusy.current = true;
    setBusy(true); setError(null);
    const started = Date.now();
    try {
      const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: action, commandId: crypto.randomUUID(), version: state.version, roomId: state.roomId }),
        signal: AbortSignal.timeout(20000) });
      const data = await response.json();
      if (!response.ok) { refreshTrigger.current(); throw new Error(data.error ?? "Music command failed."); }
      accept(data, started);
      return true;
    } catch (failure) {
      if (alive.current) setError(failure instanceof Error ? failure.message : "Music command failed.");
      return false;
    } finally { commandBusy.current = false; if (alive.current) setBusy(false); }
  }, [accept, endpoint, room]);
  const refreshNow = useCallback(() => refreshTrigger.current(), []);

  const session = snapshot?.session ?? null;
  const value = useMemo(() => ({ channelId, session, source: snapshot?.source ?? null, clockOffset,
    isDJ: session?.djUserId === room.localParticipant.identity, canStart: !!session && !session.djUserId,
    busy, error, reconnecting, command, refreshNow }), [channelId, session, snapshot?.source, clockOffset, room.localParticipant.identity, busy, error, reconnecting, command, refreshNow]);

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}
