"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { MusicButton } from "@/components/music/music-button";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { microphoneConstraints, type CallContextValue } from "./persistent-call-provider";
import { useCallActivity } from "./use-call-activity";
import type { LocalMedia, RemoteMedia } from "@/lib/media/types";
import { buildCallViews } from "@/lib/media/call-view";
import { usePushToTalk } from "./use-push-to-talk";

const emptyLocal: LocalMedia[] = [];
const emptyRemote: RemoteMedia[] = [];

export function CallWorkspace({ call }: { call: CallContextValue }) {
  const { activeCall: session, snapshot } = call;
  const local = snapshot?.local ?? emptyLocal;
  const remote = snapshot?.remote ?? emptyRemote;
  const localUserId = session?.participant.id ?? "";
  const tracks = useMemo(() => [
    ...local.filter((item) => item.kind === "audio").map((item) => ({ track: item.track, userId: localUserId, local: true })),
    ...remote.filter((item) => item.kind === "audio").map((item) => ({ track: item.track, userId: item.userId, local: false })),
  ], [local, remote, localUserId]);
  const { localCanvas, roomCanvas, speakingIds, unavailable } = useCallActivity(tracks, snapshot?.state === "connected", call.deafened);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  if (!session) return null;
  const { people, views } = buildCallViews(session.participant, local, remote, snapshot?.participants ?? [], snapshot?.micMuted ?? true);
  const activeView = views.find((view) => view.id === pinnedId)
    ?? views.find((view) => view.source === "screen")
    ?? views.find((view) => speakingIds.includes(view.person.id)) ?? views[0];
  const activePerson = activeView.person;
  const connectedPeers = new Set((snapshot?.participants ?? []).filter((person) => person.userId !== session.participant.id && person.connectionState === "connected").map((person) => person.userId)).size;
  const state = snapshot?.state ?? "connecting";
  const connected = state === "connected";
  return <section className="val-call-workspace" aria-label={`${session.title} ${session.kind === "group" ? "voice room" : "call"}`}>
    <header className="val-call-header val-cut-panel">
      <div className="val-call-overline"><span>{session.kind === "group" ? "Spaces" : "Messages"} / {session.subtitle ?? session.title}</span><span className="val-call-state" data-connected={connected} role="status">{state}</span></div>
      <div className="val-call-title-row"><h1>{session.title}</h1><p>{session.kind === "group" ? "Voice room" : "Private call"}<span>{session.subtitle}</span></p><div className="val-call-brand" aria-hidden="true">Same people.<br />Bigger spaces.<br />Further together.<b>{"// VAL"}</b></div><div className="val-lunar-banner" aria-hidden="true"><span>A more<br />human<br />internet <b>—</b></span></div></div>
    </header>
    <div className="val-call-body">
      <section className="val-speaker-panel val-cut-panel">
        <SectionLabel number="01" title={activeView.source === "screen" ? "Shared screen" : "Active speaker"} />
        <div className="val-speaker-stage">
          <div className="val-stage-status"><div><strong>{activePerson.name}</strong><span>{activeView.source === "screen" ? "Sharing screen" : speakingIds.includes(activePerson.id) ? "Speaking" : activePerson.muted ? "Microphone off" : connected ? "In room" : state}</span></div><div className="val-live-badge"><b>{connected ? "LIVE" : state.toUpperCase()}</b><SessionDuration startedAt={call.connectedAt} /><small>{connected ? "IN ROOM" : "CONNECTION"}</small></div></div>
          <div className="val-speaker-media">
            {views.map((view) => {
              return <div className="val-speaker-person" data-active={view.id === activeView.id} key={view.id} aria-hidden={view.id !== activeView.id}>
                {view.media ? <VideoMedia item={view.media} /> : <div className="val-speaker-avatar"><AvatarInitials imageUrl={view.person.image} size="lg" value={view.person.name} /></div>}
              </div>;
            })}
          </div>
          <div className="val-stage-footer"><span><CallIcon name="signal" />{activePerson.name}{activePerson.isLocal ? <b>YOU</b> : null}</span><span aria-hidden="true">Voices<br />Ideas<br />People<br />Further_</span></div>
        </div>
        {views.length > 1 ? <div className="val-call-view-strip" aria-label="Camera and screen views">
          {views.map((view) => <button type="button" className="val-call-view" key={view.id} aria-label={`Show ${view.person.name}'s ${view.source === "screen" ? "screen" : "camera"}`} aria-pressed={activeView.id === view.id} onClick={() => setPinnedId(view.id)}>
            <span className="val-call-view-preview">{view.media ? <VideoMedia item={view.media} thumbnail /> : <AvatarInitials imageUrl={view.person.image} value={view.person.name} />}</span>
            <span><strong>{view.person.name}{view.person.isLocal ? " (you)" : ""}</strong><small>{view.source === "screen" ? "Screen" : view.media ? "Camera" : "Camera off"}</small></span>
          </button>)}
          {pinnedId ? <button type="button" className="val-auto-view" onClick={() => setPinnedId(null)}>Auto view</button> : null}
        </div> : null}
      </section>
      <aside className="val-call-support">
        <details className="val-participants-panel val-cut-panel" open>
          <summary><SectionLabel number="02" title={`In room · ${people.length}`} /><CallIcon name="chevron" /></summary>
          <div className="val-participants-list">{people.map((person) => <button className="val-participant-row" key={person.id} type="button" aria-pressed={pinnedId === `camera:${person.id}`} onClick={() => setPinnedId((id) => id === `camera:${person.id}` ? null : `camera:${person.id}`)} title={`Focus ${person.name}`}>
            <AvatarInitials imageUrl={person.image} value={person.name} /><span><strong>{person.name}</strong><small>{person.isLocal ? "You" : person.connectionState === "connected" ? "Connected" : person.connectionState === "failed" ? "Connection failed" : "Connecting"}{person.muted ? " · Muted" : speakingIds.includes(person.id) ? " · Speaking" : ""}</small></span><CallIcon name={person.muted ? "mic-off" : speakingIds.includes(person.id) ? "signal" : "mic"} />
          </button>)}</div>
          {session.inviteHref ? <Link href={session.inviteHref} className="val-invite-action"><CallIcon name="plus" />Invite people</Link> : null}
        </details>
        <details className="val-connection-panel val-cut-panel" open>
          <summary><SectionLabel number="03" title="Connection" /><CallIcon name="chevron" /></summary>
          <div className="val-connection-status"><CallIcon name="globe" /><strong>{!connected ? state : people.length === 1 ? "Waiting for others" : connectedPeers === people.length - 1 ? "Connected" : "Connecting media"}</strong></div>
          <dl><div><dt>Microphone</dt><dd>{snapshot?.micMuted ? "Off" : "On"}</dd></div><div><dt>Camera</dt><dd>{snapshot?.cameraOn ? "On" : "Off"}</dd></div><div><dt>Room audio</dt><dd>{call.deafened ? "Deafened" : "On"}</dd></div></dl>
          <p className="val-connection-note">{connected ? `${connectedPeers} of ${people.length - 1} other participants connected for audio and video.` : "Waiting for room connection."}</p>
        </details>
      </aside>
      <section className="val-audio-panel val-cut-panel">
        <SectionLabel number="04" title="Audio activity" />
        <div className="val-audio-meters"><div><span>You</span><canvas ref={localCanvas} width={640} height={40} aria-label={snapshot?.micMuted ? "Microphone off" : "Microphone frequency activity"} /><small>{snapshot?.micMuted ? "OFF" : "INPUT"}</small></div><div><span>Room</span><canvas ref={roomCanvas} width={640} height={40} aria-label={call.deafened ? "Room audio deafened" : "Received audio frequency activity"} /><small>{call.deafened ? "OFF" : "OUTPUT"}</small></div></div>
        {unavailable ? <p className="val-connection-note">Audio visualization unavailable. Call audio is unaffected.</p> : null}
      </section>
      <aside className="val-call-quote" aria-hidden="true"><span>—</span><p>Better<br />conversations<br />build<br />brighter worlds.</p><b>{"// VAL"}</b></aside>
    </div>
    <CallControls call={call} />
  </section>;
}
function SectionLabel({ number, title }: { number: string; title: string }) { return <div className="val-section-label"><b>{number}</b><span>[ {title} ]</span><i /></div>; }
function SessionDuration({ startedAt }: { startedAt: number | null }) {
  const [now, setNow] = useState(0);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  const elapsed = startedAt && now > startedAt ? Math.floor((now - startedAt) / 1000) : 0;
  return <time aria-label="Session duration">{Math.floor(elapsed / 3600).toString().padStart(2,"0")}:{Math.floor(elapsed / 60 % 60).toString().padStart(2,"0")}:{(elapsed % 60).toString().padStart(2,"0")}</time>;
}
function VideoMedia({ item, thumbnail = false }: { item: LocalMedia | RemoteMedia; thumbnail?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let active = true;
    element.srcObject = new MediaStream([item.track]);
    void element.play().then(() => { if (active) setBlocked(false); }).catch(() => { if (active) setBlocked(true); });
    return () => { active = false; element.srcObject = null; };
  }, [item.track]);
  return <><video ref={ref} autoPlay muted playsInline onPlaying={() => setBlocked(false)} className="val-stage-video" data-source={item.source} />{blocked && !thumbnail ? <button className="val-video-resume app-button-secondary" type="button" onClick={() => { void ref.current?.play().then(() => setBlocked(false)).catch((cause) => console.warn("Video playback blocked", cause)); }}>Play video</button> : null}</>;
}
export function CallControls({ call, compact = false }: { call: CallContextValue; compact?: boolean }) {
  const pushToTalk = usePushToTalk(call.media, call.activeCall?.voiceSettings, call.setError);
  const [busy, setBusy] = useState(false);
  const [more, setMore] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => { const frame = requestAnimationFrame(() => setCanShare(Boolean(navigator.mediaDevices?.getDisplayMedia))); return () => cancelAnimationFrame(frame); }, []);
  useEffect(() => {
    if (!more) return;
    function close(event: KeyboardEvent) { if (event.key === "Escape") { setMore(false); toggleRef.current?.focus(); } }
    function outside(event: PointerEvent) { if (!moreRef.current?.contains(event.target as Node) && !toggleRef.current?.contains(event.target as Node)) setMore(false); }
    document.addEventListener("keydown", close); document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", outside); };
  }, [more]);
  const { activeCall, media, snapshot } = call;
  if (!activeCall) return null;
  const run = (action: () => Promise<unknown>) => {
    setBusy(true); call.setError(null);
    void action().catch((cause: unknown) => { console.error(cause); call.setError(cause instanceof Error ? cause.message : "Could not update media. Please try again."); }).finally(() => setBusy(false));
  };
  const disabled = busy || !media || snapshot?.state !== "connected";
  const connectionFailed = snapshot?.state === "failed" || Boolean(snapshot?.error) || snapshot?.participants.some((person) => person.connectionState === "failed");
  const toggleMic = () => {
    if (!media || pushToTalk.enabled) return;
    run(async () => { await media.setMicMuted(!snapshot?.micMuted); if (snapshot?.micMuted && !snapshot.local.some((item) => item.source === "mic")) await media.start("mic", microphoneConstraints(activeCall.voiceSettings)); });
  };
  return <footer className={`val-call-controls val-cut-panel${compact ? " val-call-controls-compact" : ""}`}>
    {call.audioBlocked ? <div className="val-call-error" role="status"><p>Your browser paused call audio.</p><button className="app-button-secondary val-action" type="button" onClick={call.resumeAudio}>Enable audio</button></div> : null}
    {call.error || connectionFailed ? <div className="val-call-error" role="alert"><p>{call.error ?? snapshot?.error ?? "A call connection was interrupted. Reconnect to rejoin."}</p>{!media || connectionFailed ? <button className="app-button-secondary val-action" type="button" onClick={() => call.startCall(activeCall)}>Reconnect</button> : <button type="button" onClick={() => call.setError(null)} aria-label="Dismiss call error">×</button>}</div> : null}
    <div className="val-call-control-row">
      <button className="val-call-control val-mic-control" aria-pressed={!snapshot?.micMuted} aria-label={pushToTalk.enabled ? "Hold to talk" : snapshot?.micMuted ? "Unmute microphone" : "Mute microphone"} disabled={disabled} onClick={toggleMic}
        onPointerDown={(event) => { if (pushToTalk.enabled) { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); pushToTalk.press(); } }}
        onPointerUp={pushToTalk.release} onPointerCancel={pushToTalk.release} onLostPointerCapture={pushToTalk.release} onBlur={pushToTalk.release}
        onKeyDown={(event) => { if (pushToTalk.enabled && [" ", "Enter"].includes(event.key)) { event.preventDefault(); pushToTalk.press(); } }}
        onKeyUp={(event) => { if (pushToTalk.enabled && [" ", "Enter"].includes(event.key)) pushToTalk.release(); }}
        type="button"><CallIcon name={snapshot?.micMuted ? "mic-off" : "mic"} /><span>{pushToTalk.enabled ? "Hold to talk" : "Mic"}<small>{snapshot?.micMuted ? pushToTalk.enabled ? settingsKey(activeCall.voiceSettings?.pushToTalkKey) : "Off" : "On"}</small></span></button>
      <div className={`val-secondary-controls${more ? " is-open" : ""}`} ref={moreRef}>
        {activeCall.kind === "group" ? <button className="val-call-control" disabled={disabled} aria-pressed={snapshot?.cameraOn ?? false} onClick={() => { if (media) run(() => snapshot?.cameraOn ? media.stop("camera") : media.start("camera", true)); }} type="button"><CallIcon name="camera" /><span>Camera<small>{snapshot?.cameraOn ? "On" : "Off"}</small></span></button> : null}
        <button className="val-call-control" disabled={disabled || (!canShare && !snapshot?.screenOn)} aria-pressed={snapshot?.screenOn ?? false} title={canShare ? "Share your screen" : "Screen sharing is unavailable in this browser"} onClick={() => { if (media) run(() => snapshot?.screenOn ? media.stop("screen") : media.start("screen", true)); }} type="button"><CallIcon name="screen" /><span>Share<small>{snapshot?.screenOn ? "Sharing" : canShare ? "Screen" : "Unavailable"}</small></span></button>
        <button className="val-call-control" aria-pressed={call.deafened} onClick={() => call.setDeafened(!call.deafened)} type="button"><CallIcon name="headphones" /><span>Deafen<small>{call.deafened ? "On" : "Off"}</small></span></button>
        <Link className="val-device-settings" href="/dashboard/profile#voice">Audio devices <CallIcon name="chevron" /></Link>
        {activeCall.kind === "group" ? <MusicButton /> : null}
        {!compact ? <button className="val-popout-button" type="button" onClick={() => call.setPoppedOut(true)} aria-label="Pop out call"><CallIcon name="expand" /><span>Pop out</span></button> : null}
        <button className="val-close-more" type="button" onClick={() => { setMore(false); toggleRef.current?.focus(); }}>Close controls</button>
      </div>
      <button className="val-more-control val-call-control" aria-expanded={more} ref={toggleRef} onClick={() => setMore(!more)} type="button"><CallIcon name="more" /><span>More</span></button>
      <button className="val-call-leave" onClick={call.endCall} type="button"><CallIcon name="phone" /><span>Leave</span></button>
    </div>
    {!compact ? <div className="val-controls-caption" aria-hidden="true"><span>Spaces foundation</span><span>A more human internet</span><b>{"// VAL"}</b></div> : null}
  </footer>;
}
function settingsKey(key?: string | null) { return key || "Space / hold"; }
export function CallIcon({ name }: { name: "mic" | "mic-off" | "camera" | "screen" | "headphones" | "phone" | "expand" | "chevron" | "signal" | "globe" | "plus" | "more" }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{(name === "mic" || name === "mic-off") ? <>{name === "mic-off" ? <path d="m3 3 18 18" /> : null}<rect x="9" y="2" width="6" height="13" rx="3" /><path d="M5 10v3a7 7 0 0 0 14 0v-3M12 20v2M9 22h6" /></> : name === "camera" ? <><rect x="2" y="5" width="14" height="14" rx="2" /><path d="m16 10 6-4v12l-6-4" /></> : name === "screen" ? <><rect x="2" y="3" width="20" height="14" rx="1" /><path d="M12 17v4M7 21h10" /></> : name === "headphones" ? <><path d="M3 17v-5a9 9 0 0 1 18 0v5" /><rect x="3" y="13" width="4" height="8" rx="1" /><rect x="17" y="13" width="4" height="8" rx="1" /></> : name === "phone" ? <path d="M3 16v-4c5-6 13-6 18 0v4h-5v-4a9 9 0 0 0-8 0v4Z" /> : name === "expand" ? <path d="M9 3H3v6M15 3h6v6M3 15v6h6M21 15v6h-6M3 3l6 6m6 6 6 6" /> : name === "chevron" ? <path d="m7 10 5 5 5-5" /> : name === "signal" ? <path d="M3 10v4m4-8v12m5-16v20m5-17v14m4-9v4" /> : name === "plus" ? <path d="M12 4v16M4 12h16" /> : name === "more" ? <><circle cx="4" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="20" cy="12" r="1" /></> : <><circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="5" ry="10" /><path d="M2 12h20M4 6h16M4 18h16" /></>}</svg>;
}
