"use client";

import { useEffect, useId, useRef, useState } from "react";
import { expectedPosition, type MusicCommand, type MusicSession } from "@/lib/music/types";
import { MusicArtwork, MusicIcon, musicTime } from "./music-ui";
import { useMusicVolume } from "./music-session-provider";

export function MusicProgress({ session, clockOffset, disabled, command, active }: { session: MusicSession; clockOffset: number; disabled: boolean; active: boolean; command: (command: MusicCommand) => Promise<boolean> }) {
  return <TrackProgress key={session.track?.queueId ?? "empty"} session={session} clockOffset={clockOffset} disabled={disabled} command={command} active={active} />;
}

function TrackProgress({ session, clockOffset, disabled, command, active }: Parameters<typeof MusicProgress>[0]) {
  const [now, setNow] = useState(() => Date.now());
  const [seeking, setSeeking] = useState<number | null>(null);
  const draft = useRef<number | null>(null);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!active || session.state !== "PLAYING") return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const schedule = () => {
      clearInterval(timer); timer = undefined;
      if (document.visibilityState === "visible") {
        setNow(Date.now());
        timer = setInterval(() => setNow(Date.now()), 1000);
      }
    };
    const initial = setTimeout(schedule, 0); document.addEventListener("visibilitychange", schedule);
    return () => { clearTimeout(initial); clearInterval(timer); document.removeEventListener("visibilitychange", schedule); };
  }, [active, session.state]);
  const position = Math.min(session.track?.duration ?? 0, seeking ?? expectedPosition(session, now + clockOffset));
  const commit = async () => {
    const value = draft.current;
    draft.current = null;
    if (value === null) return;
    if (disabled) { setSeeking(null); return; }
    setPending(true);
    try { await command({ type: "seek", position: value }); }
    finally { setNow(Date.now()); setSeeking(null); setPending(false); }
  };
  return <div className="music-progress"><input type="range" aria-label="Seek music" min={0} max={session.track?.duration ?? 0} step={1} value={position}
    aria-valuetext={`${musicTime(position)} of ${musicTime(session.track?.duration ?? 0)}`} disabled={disabled || pending}
    onChange={(event) => { draft.current = Number(event.target.value); setSeeking(draft.current); }}
    onPointerDown={(event) => event.currentTarget.setPointerCapture(event.pointerId)}
    onPointerUp={() => void commit()} onKeyUp={(event) => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End", "PageUp", "PageDown"].includes(event.key)) void commit(); }}
    onPointerCancel={() => { draft.current = null; setSeeking(null); }} onBlur={() => void commit()} />
    <div><time>{musicTime(position)}</time><time>{musicTime(session.track?.duration ?? 0)}</time></div></div>;
}

export function MusicVolumeControl() {
  const audio = useMusicVolume();
  const volumeId = useId();
  return <div className="music-volume"><label htmlFor={volumeId}>Music volume <span>(you only)</span></label>
    <div><MusicIcon name={audio.muted ? "muted" : "volume"} /><input id={volumeId} type="range" min={0} max={100} step={1} aria-valuetext={audio.muted ? `Muted, volume ${Math.round(audio.volume * 100)} percent` : `${Math.round(audio.volume * 100)} percent`}
      value={Math.round(audio.volume * 100)} onChange={(event) => audio.setVolume(Number(event.target.value) / 100)} />
      <output htmlFor={volumeId}>{audio.muted ? "Muted" : `${Math.round(audio.volume * 100)}%`}</output>
      <button type="button" className="music-icon-button" aria-label={audio.muted ? "Unmute music" : "Mute music"} aria-pressed={audio.muted} onClick={() => audio.setMuted(!audio.muted)}><MusicIcon name={audio.muted ? "muted" : "volume"} /></button>
    </div>
  </div>;
}

export function MusicMiniControls({ disabled, playing, command, onAdd, queueCount }: {
  disabled: boolean; playing: boolean; command: (command: MusicCommand) => Promise<boolean>; onAdd: () => void; queueCount: number;
}) {
  const audio = useMusicVolume();
  return <>
    <div className="music-mini-transport">
      <button type="button" className="music-icon-button" disabled={disabled} aria-label="Restart track" title="Restart track (DJ)" onClick={() => void command({ type: "restart" })}><MusicIcon name="restart" /></button>
      <button type="button" className="music-play-button" disabled={disabled} aria-label={playing ? "Pause music" : "Play music"} title={playing ? "Pause (DJ)" : "Play (DJ)"} onClick={() => void command({ type: playing ? "pause" : "play" })}><MusicIcon name={playing ? "pause" : "play"} /></button>
      <button type="button" className="music-icon-button" disabled={disabled} aria-label="Next track" title="Next track (DJ)" onClick={() => void command({ type: "next" })}><MusicIcon name="next" /></button>
      <button type="button" className="music-mini-add" onClick={onAdd} title="Search and add music"><MusicIcon name="plus" /><span>Queue <small>{queueCount}</small></span></button>
    </div>
    <div className="music-mini-volume">
      <button type="button" className="music-icon-button" aria-label={audio.muted ? "Unmute music locally" : "Mute music locally"} title="Mute just for you" aria-pressed={audio.muted} onClick={() => audio.setMuted(!audio.muted)}><MusicIcon name={audio.muted ? "muted" : "volume"} /></button>
      <input type="range" aria-label="Music volume for you only" min={0} max={100} step={1} value={Math.round(audio.volume * 100)} onChange={(event) => audio.setVolume(Number(event.target.value) / 100)} />
      <span>{audio.muted ? "Muted" : `${Math.round(audio.volume * 100)}%`}</span>
    </div>
  </>;
}

export function MusicQueue({ session, disabled, command }: { session: MusicSession; disabled: boolean; command: (command: MusicCommand) => Promise<boolean> }) {
  const [menu, setMenu] = useState<string | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const actionsId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const clearButton = useRef<HTMLButtonElement>(null);
  const action = async (type: "moveNext" | "moveBottom" | "remove", queueId: string) => {
    const title = session.queue.find((track) => track.queueId === queueId)?.title ?? "Track";
    if (await command({ type, queueId })) {
      setAnnouncement(`${title} ${type === "remove" ? "removed from queue" : type === "moveNext" ? "will play next" : "moved to the bottom"}.`);
      if (type === "remove") { setMenu(null); heading.current?.focus(); }
    }
  };
  const move = async (queueId: string, direction: number) => {
    const ids = session.queue.map((track) => track.queueId);
    const index = ids.indexOf(queueId), target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    if (await command({ type: "reorder", queueIds: ids })) setAnnouncement(`Track moved to position ${target + 1} of ${ids.length}.`);
  };
  const drop = (target: string) => {
    if (disabled || !dragging || dragging === target) return;
    const ids = session.queue.map((track) => track.queueId).filter((id) => id !== dragging);
    ids.splice(ids.indexOf(target), 0, dragging);
    void command({ type: "reorder", queueIds: ids }); setDragging(null);
  };
  return <section className="music-queue"><div className="music-section-heading"><h3 ref={heading} tabIndex={-1}>Up next <span>({session.queue.length}/30)</span></h3>
    {session.queue.length > 0 && <button ref={clearButton} type="button" className="music-text-button" disabled={disabled} onClick={() => setConfirmClear(!confirmClear)} aria-expanded={confirmClear}>Clear queue</button>}</div>
    <p className="music-sr-only" role="status">{announcement}</p>
    {confirmClear && session.queue.length > 0 && <div className="music-clear-confirm"><span>Remove all {session.queue.length} queued songs?</span><div className="music-row-actions"><button type="button" disabled={disabled} onClick={async () => { if (await command({ type: "clear" })) { setConfirmClear(false); setAnnouncement("Queue cleared. Current song continues."); heading.current?.focus(); } }}>Clear all</button><button type="button" onClick={() => { setConfirmClear(false); clearButton.current?.focus(); }}>Keep queue</button></div></div>}
    {!!session.queue.length && <p className="music-queue-summary">{musicTime(session.queue.reduce((total, track) => total + track.duration, 0))} queued · Your queue plays before autoplay</p>}
    {!session.queue.length && <p className="music-empty">{session.autoplay ? "Autoplay will find a similar song when this one ends. Add a song to choose what plays next." : "The queue is open. Add something for the room, or turn on autoplay to keep listening."}</p>}
    <ul className="music-track-list">{session.queue.map((track, index) => <li key={track.queueId} className={dragging === track.queueId ? "music-track-dragging" : undefined} onDragOver={(event) => { if (!disabled && dragging) event.preventDefault(); }} onDrop={(event) => { event.preventDefault(); drop(track.queueId); }}>
      <div className="music-track-row"><span draggable={!disabled} onDragStart={(event) => { event.dataTransfer.setData("text/plain", track.queueId); event.dataTransfer.effectAllowed = "move"; setDragging(track.queueId); }} onDragEnd={() => setDragging(null)} className="music-drag" title={disabled ? undefined : "Drag to reorder; use track actions with a keyboard"}><MusicIcon name="grip" /></span>
        <MusicArtwork track={track} /><div className="music-track-text"><span title={track.title}>{track.title}</span><small>{track.artist}</small></div><time>{musicTime(track.duration)}</time>
        <button type="button" className="music-icon-button" disabled={disabled} aria-label={`Queue actions for ${track.title}, position ${index + 1}`} aria-controls={`${actionsId}-${track.queueId}`} aria-expanded={menu === track.queueId} onClick={() => setMenu(menu === track.queueId ? null : track.queueId)}><MusicIcon name="more" /></button>
      </div>
      {menu === track.queueId && <div id={`${actionsId}-${track.queueId}`} className="music-row-actions" onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); setMenu(null); event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(".music-track-row button")?.focus(); } }}>
        <button type="button" disabled={disabled || index === 0} onClick={() => void move(track.queueId, -1)}>Move up</button><button type="button" disabled={disabled || index === session.queue.length - 1} onClick={() => void move(track.queueId, 1)}>Move down</button>
        <button type="button" disabled={disabled || index === 0} onClick={() => action("moveNext", track.queueId)}>Play next</button><button type="button" disabled={disabled || index === session.queue.length - 1} onClick={() => action("moveBottom", track.queueId)}>Move to bottom</button><button type="button" disabled={disabled} onClick={() => action("remove", track.queueId)}>Remove</button></div>}
    </li>)}</ul>
  </section>;
}
