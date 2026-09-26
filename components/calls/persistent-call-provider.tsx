"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { CallWorkspace, CallControls } from "@/components/calls/call-workspace";
import { MediaClient } from "@/lib/media/media-client";
import type { MediaParticipant, RemoteMedia } from "@/lib/media/types";
import type { VoiceSettings } from "@/lib/voice-settings";

export type PersistentCallSession = {
  href?: string; id: string; kind: "friend" | "group"; title: string; subtitle?: string;
  participant: { id: string; name: string; email: string; image?: string | null };
  signalingRoomId: string; roomId: string; endUrl?: string; statusUrl?: string;
  voiceSettings?: VoiceSettings; inviteHref?: string;
};
export type CallContextValue = {
  activeCall: PersistentCallSession | null; endCall: () => void; endedCallIds: ReadonlySet<string>;
  poppedOut: boolean; setPoppedOut: (value: boolean) => void; startCall: (session: PersistentCallSession) => void;
  media: MediaClient | null; snapshot: ReturnType<MediaClient["snapshot"]> | null;
  error: string | null; setError: (message: string | null) => void; connectedAt: number | null;
  deafened: boolean; setDeafened: (value: boolean) => void;
};
const CallContext = createContext<CallContextValue | null>(null);
const endedKey = "val:ended-media-sessions";
const readEnded = () => { try { return new Set<string>(JSON.parse(sessionStorage.getItem(endedKey) ?? "[]")); } catch { return new Set<string>(); } };

export function PersistentCallProvider({ children }: { children: React.ReactNode }) {
  const [activeCall, setActiveCall] = useState<PersistentCallSession | null>(null);
  const [endedCallIds, setEnded] = useState<ReadonlySet<string>>(() => typeof window === "undefined" ? new Set() : readEnded());
  const [poppedOut, setPoppedOut] = useState(false);
  const [snapshot, setSnapshot] = useState<ReturnType<MediaClient["snapshot"]> | null>(null);
  const [media, setMedia] = useState<MediaClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [deafened, setDeafened] = useState(false);
  const clientRef = useRef<MediaClient | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const remember = useCallback((id: string) => setEnded((current) => {
    const next = new Set(current); next.add(id);
    try { sessionStorage.setItem(endedKey, JSON.stringify([...next].slice(-50))); }
    catch (cause) { console.warn("Could not persist ended call history", cause); }
    return next;
  }), []);

  const endCall = useCallback(() => {
    const session = activeCall;
    if (!session) return;
    unsubscribeRef.current?.(); unsubscribeRef.current = null;
    const client = clientRef.current; clientRef.current = null;
    void client?.leave().catch((cause) => console.error("Could not finish media cleanup", cause));
    setMedia(null); setSnapshot(null); setConnectedAt(null); setError(null);
    if (session.endUrl) void fetch(session.endUrl, { method: "POST" }).then((response) => {
      if (!response.ok) throw new Error("The server could not acknowledge the ended call.");
    }).catch((cause) => { console.error(cause); setError("You left locally. The call status could not be updated on the server."); });
    remember(session.id); setActiveCall(null); setPoppedOut(false);
    if (session.kind === "friend" && pathname === session.href) router.replace("/dashboard/messages");
  }, [activeCall, pathname, remember, router]);

  const startCall = useCallback((session: PersistentCallSession) => {
    unsubscribeRef.current?.(); unsubscribeRef.current = null;
    const previous = clientRef.current;
    const client = new MediaClient(); clientRef.current = client;
    setMedia(client); setSnapshot(client.snapshot()); setActiveCall(session); setPoppedOut(false);
    setConnectedAt(null); setError(null); setDeafened(session.voiceSettings?.joinDeafened ?? false);
    unsubscribeRef.current = client.subscribe(() => { if (clientRef.current === client) setSnapshot(client.snapshot()); });
    setEnded((current) => { const next = new Set(current); next.delete(session.id); return next; });
    void (async () => {
      await previous?.leave();
      if (clientRef.current !== client) return;
      await client.connect({ participant: session.participant, signalingRoomId: session.signalingRoomId });
      if (clientRef.current !== client) { await client.leave(); return; }
      setConnectedAt(Date.now());
      const settings = session.voiceSettings;
      if (!settings?.joinMuted) {
        try {
          await client.start("mic", microphoneConstraints(settings));
          if (clientRef.current !== client) await client.leave();
        } catch (cause) {
          console.error("Microphone unavailable", cause);
          if (clientRef.current === client) setError("Connected with microphone off. Allow microphone access or choose an available device, then unmute.");
        }
      }
    })().catch((cause) => {
      console.error("Media connection failed", cause);
      if (clientRef.current === client) {
        setError(cause instanceof Error ? cause.message : "Could not connect to this room.");
        setSnapshot({ ...client.snapshot(), state: "failed" });
        unsubscribeRef.current?.(); unsubscribeRef.current = null;
        clientRef.current = null; setMedia(null);
      }
      void client.leave().catch((cleanupError) => console.error("Media cleanup failed", cleanupError));
    });
  }, []);

  useEffect(() => () => {
    unsubscribeRef.current?.();
    const client = clientRef.current; clientRef.current = null;
    void client?.leave().catch((cause) => console.error("Media cleanup failed", cause));
  }, []);
  useEffect(() => {
    if (!activeCall?.statusUrl) return;
    const statusUrl = activeCall.statusUrl;
    const controller = new AbortController();
    const timer = window.setInterval(async () => {
      try {
        const response = await fetch(statusUrl, { signal: controller.signal });
        if (!response.ok) throw new Error("Call status unavailable");
        const data = await response.json() as { status?: string };
        if (["DECLINED", "MISSED", "ENDED"].includes(data.status ?? "")) endCall();
      } catch (cause) { if (!controller.signal.aborted) console.warn("Could not refresh call status", cause); }
    }, 3000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [activeCall?.statusUrl, endCall]);

  const value = useMemo(() => ({ activeCall, endCall, endedCallIds, poppedOut, setPoppedOut, startCall, media, snapshot, error, setError, connectedAt, deafened, setDeafened }), [activeCall, endCall, endedCallIds, media, poppedOut, snapshot, startCall, error, connectedAt, deafened]);
  const floating = activeCall && (poppedOut || (activeCall.href && pathname !== activeCall.href.split("?")[0]));
  return <CallContext.Provider value={value}>
    {children}
    {/* Audio belongs to the session, never to a route or a participant tile. */}
    <div className="sr-only">{snapshot?.remote.filter((item) => item.kind === "audio").map((item) => <RemoteAudioElement key={item.consumerId} item={item} deafened={deafened} settings={activeCall?.voiceSettings} onError={setError} />)}</div>
    {floating ? <aside className="val-floating-call" aria-label="Ongoing call">
      <div className="val-floating-heading"><span><strong>{activeCall.title}</strong><small>{snapshot?.state ?? "connecting"}</small></span>
        {activeCall.href ? <Link className="val-action app-button-secondary" href={activeCall.href} onClick={() => setPoppedOut(false)}>Return to call</Link> : <button type="button" onClick={() => setPoppedOut(false)}>Return</button>}
      </div>
      <CallControls call={value} compact />
    </aside> : null}
    {!activeCall && error ? <div className="val-call-notice" role="alert">{error}<button type="button" onClick={() => setError(null)}>Dismiss</button></div> : null}
  </CallContext.Provider>;
}
export function usePersistentCall() { const value = useContext(CallContext); if (!value) throw new Error("usePersistentCall must be used within PersistentCallProvider."); return value; }
export function useOptionalPersistentCall() { return useContext(CallContext); }
export function PersistentCallSurface({ sessionId }: { sessionId: string }) {
  const call = usePersistentCall();
  if (!call.activeCall || call.activeCall.id !== sessionId) return null;
  if (call.poppedOut) return <section className="val-call-return"><h2>Your call is in the floating panel.</h2><p>Audio stays connected while you browse.</p><button className="app-button-primary val-action" onClick={() => call.setPoppedOut(false)} type="button">Return to call</button></section>;
  return <CallWorkspace call={call} />;
}
export function microphoneConstraints(settings?: VoiceSettings): MediaTrackConstraints {
  return { autoGainControl: settings?.autoGainControl, deviceId: settings?.inputDeviceId ? { ideal: settings.inputDeviceId } : undefined, echoCancellation: settings?.echoCancellation, noiseSuppression: settings?.noiseSuppression };
}
function RemoteAudioElement({ item, deafened, settings, onError }: { item: RemoteMedia; deafened: boolean; settings?: VoiceSettings; onError: (message: string) => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    element.srcObject = new MediaStream([item.track]);
    const play = () => { void element.play().catch((cause) => { console.warn("Remote audio playback blocked", cause); onError("Audio playback was blocked by your browser. Tap any call control to resume audio."); }); };
    play();
    document.addEventListener("pointerdown", play);
    return () => { document.removeEventListener("pointerdown", play); element.srcObject = null; };
  }, [item.track, onError]);
  useEffect(() => {
    const element = audioRef.current;
    if (!element) return;
    element.volume = Math.max(0, Math.min(1, (settings?.outputVolume ?? 100) / 100));
    if (settings?.outputDeviceId && "setSinkId" in element) void element.setSinkId(settings.outputDeviceId).catch((cause) => { console.warn("Output device unavailable", cause); onError("The selected output device is unavailable. Using the default audio output."); });
  }, [settings?.outputDeviceId, settings?.outputVolume, onError]);
  return <audio autoPlay muted={deafened} ref={audioRef} />;
}
export function ParticipantVoiceControlsPanel({ onClose, participant }: { onClose: () => void; participant: MediaParticipant }) {
  return <div className="app-panel absolute right-0 top-full z-50 mt-2 w-64 p-3"><div className="flex justify-between gap-2"><p className="truncate text-sm font-semibold">{participant.metadata?.name || "Participant"}</p><button className="min-h-11 px-2" onClick={onClose} type="button">Close</button></div><p className="mt-2 text-xs">Local participant controls are available from the call surface.</p></div>;
}
