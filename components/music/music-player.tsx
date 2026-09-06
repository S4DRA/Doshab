"use client";

import { useEffect, useState } from "react";
import { expectedPosition, type MusicCommand, type MusicSession } from "@/lib/music/types";
import { MusicArtwork, MusicIcon, musicTime } from "./music-ui";
import { useMusicVolume } from "./music-session-provider";

export function MusicProgress({ session, clockOffset, disabled, command, active }: { session: MusicSession; clockOffset: number; disabled: boolean; active: boolean; command: (command: MusicCommand) => Promise<boolean> }) {
  const [now, setNow] = useState(() => Date.now());
  const [seeking, setSeeking] = useState<number | null>(null);
  useEffect(() => {
    if (!active || session.state !== "PLAYING") return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const schedule = () => {
      clearInterval(timer); timer = undefined;
      if (document.visibilityState === "visible") timer = setInterval(() => setNow(Date.now()), 500);
    };
    schedule(); document.addEventListener("visibilitychange", schedule);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", schedule); };
  }, [active, session.state]);
  const position = seeking ?? expectedPosition(session, now + clockOffset);
  const commit = () => { if (seeking !== null) { void command({ type: "seek", position: seeking }); setSeeking(null); } };
  return <div className="music-progress"><input type="range" aria-label="Seek music" min={0} max={session.track?.duration ?? 0} step={0.1} value={position}
    aria-valuetext={`${musicTime(position)} of ${musicTime(session.track?.duration ?? 0)}`} disabled={disabled}
    onChange={(event) => setSeeking(Number(event.target.value))} onPointerUp={commit} onKeyUp={commit} onBlur={commit} />
    <div><time>{musicTime(position)}</time><time>{musicTime(session.track?.duration ?? 0)}</time></div></div>;
}

export function MusicVolumeControl() {
  const audio = useMusicVolume();
  return <div className="music-volume"><label htmlFor="val-music-volume">Music volume <span>(you only)</span></label>
    <div><MusicIcon name={audio.muted ? "muted" : "volume"} /><input id="val-music-volume" type="range" min={0} max={100} step={1}
      value={Math.round(audio.volume * 100)} onChange={(event) => audio.setVolume(Number(event.target.value) / 100)} />
      <output htmlFor="val-music-volume">{Math.round(audio.volume * 100)}%</output>
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
  const action = (type: "moveNext" | "moveBottom" | "remove", queueId: string) => { setMenu(null); void command({ type, queueId }); };
  const drop = (target: string) => {
    if (disabled || !dragging || dragging === target) return;
    const ids = session.queue.map((track) => track.queueId).filter((id) => id !== dragging);
    ids.splice(ids.indexOf(target), 0, dragging);
    void command({ type: "reorder", queueIds: ids }); setDragging(null);
  };
  return <section className="music-queue"><div className="music-section-heading"><h3>Up next <span>({session.queue.length})</span></h3>
    {session.queue.length > 0 && <button type="button" className="music-text-button" disabled={disabled} onClick={() => void command({ type: "clear" })}>Clear</button>}</div>
    {!session.queue.length && <p className="music-empty">The queue is open. Add something for the room.</p>}
    <ul className="music-track-list">{session.queue.map((track) => <li key={track.queueId} onDragOver={(event) => { if (!disabled) event.preventDefault(); }} onDrop={() => drop(track.queueId)}>
      <div className="music-track-row"><span draggable={!disabled} onDragStart={() => setDragging(track.queueId)} onDragEnd={() => setDragging(null)} className="music-drag" title={disabled ? undefined : "Drag to reorder; use track actions with a keyboard"}><MusicIcon name="grip" /></span>
        <MusicArtwork track={track} /><div className="music-track-text"><span title={track.title}>{track.title}</span><small>{track.artist}</small></div><time>{musicTime(track.duration)}</time>
        <button type="button" className="music-icon-button" disabled={disabled} aria-label={`Queue actions for ${track.title}`} aria-expanded={menu === track.queueId} onClick={() => setMenu(menu === track.queueId ? null : track.queueId)}><MusicIcon name="more" /></button>
      </div>
      {menu === track.queueId && <div className="music-row-actions"><button disabled={disabled} onClick={() => action("moveNext", track.queueId)}>Play next</button><button disabled={disabled} onClick={() => action("moveBottom", track.queueId)}>Move to bottom</button><button disabled={disabled} onClick={() => action("remove", track.queueId)}>Remove</button></div>}
    </li>)}</ul>
  </section>;
}
