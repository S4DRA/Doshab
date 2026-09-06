"use client";

import { useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import dynamic from "next/dynamic";
import { MusicErrorBoundary, useMusicSession } from "./music-session-provider";
import { useMusicStatus } from "./music-volume";
import { MusicSearch } from "./music-search";
import { MusicProgress, MusicQueue, MusicVolumeControl, MusicMiniControls } from "./music-player";
import { MusicArtwork, MusicIcon } from "./music-ui";
import { usePlayerPosition } from "./use-player-position";
import type { MusicCommand } from "@/lib/music/types";

const YouTubePlayback = dynamic(() => import("./youtube-playback").then((module) => module.YouTubePlayback), {
  ssr: false, loading: () => <div className="music-youtube-video music-video-loading" role="status">Loading YouTube player…</div>,
});

export function ListenTogetherPopover({ minimized, onExpand, onMinimize, onClose, anchor }: {
  minimized: boolean; onExpand: () => void; onMinimize: () => void; onClose: () => void;
  anchor: RefObject<HTMLButtonElement | null>;
}) {
  const music = useMusicSession()!;
  const audio = useMusicStatus();
  const [searching, setSearching] = useState(false);

  const { panel, ...dragHandle } = usePlayerPosition(anchor);
  const { session, isDJ, busy, command } = music;
  const track = session?.track;
  const disabled = !isDJ || busy || music.reconnecting;
  const searchMode = searching || !track;

  useEffect(() => {
    panel.current?.focus();
  }, [minimized, panel]);

  const send = async (action: MusicCommand) => { const ok = await command(action); if (ok && action.type === "playNow") setSearching(false); return ok; };
  return createPortal(<div ref={panel} role="dialog" aria-modal="false" aria-label="Listen Together" tabIndex={-1}
    className={`music-popover${minimized ? " music-mini" : ""}`}
    onKeyDown={(event) => { if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); onClose(); } }}>
    <header className={`music-header${minimized ? " music-mini-header" : ""}`}>
      <button type="button" className="music-move-handle" aria-label="Move music player with arrow keys or drag" title="Drag to move · Arrow keys to reposition" {...dragHandle}>
        <MusicIcon name="grip" /><span>{minimized ? "LISTEN TOGETHER" : "Listen Together"}</span>{!minimized && <small>BETA</small>}
      </button>
      <button type="button" className="music-icon-button" aria-label={minimized ? "Expand music player" : "Minimize music player"} title={minimized ? "Expand" : "Minimize"} onClick={minimized ? onExpand : onMinimize}><MusicIcon name={minimized ? "expand" : "minimize"} /></button>
      <button type="button" className="music-icon-button" aria-label="Close music popup" title="Close" onClick={onClose}><MusicIcon name="close" /></button>
    </header>
    {minimized && <div className="music-mini-summary">
      <button type="button" className="music-mini-track" onClick={onExpand} title={track?.title} aria-label="Expand track details">{track && <MusicArtwork track={track} />}<span><strong>{track?.title ?? "Pick your next song"}</strong><small>{track?.artist ?? "Open search to start listening"}</small></span></button>
      <span className="music-mini-state">{music.reconnecting ? "Connecting" : session?.state === "PLAYING" ? "Playing" : "Paused"}</span>
    </div>}    {track && <MusicErrorBoundary><YouTubePlayback /></MusicErrorBoundary>}
    {minimized && <div className="music-mini-tools">
      <MusicMiniControls disabled={disabled || !track} playing={session?.state === "PLAYING"} command={command} onAdd={() => { setSearching(true); onExpand(); }} queueCount={session?.queue.length ?? 0} />
      {music.error && <p className="music-error" role="alert">{music.error}</p>}
    </div>}
    <div className="music-expanded" hidden={minimized}>
      <div className="music-scroll">
        {music.reconnecting && <p className="music-notice" role="status">Reconnecting to room music…</p>}
        {music.error && <p className="music-error" role="alert">{music.error}</p>}
        {session?.notice && <p className="music-notice" role="status">{session.notice}</p>}
        {audio.playbackError && <p className="music-error" role="alert">{audio.playbackError} {isDJ ? "Try the next track." : "The DJ can choose another track."}</p>}
        {(audio.blocked || audio.localPaused) && <button type="button" className="music-join" onClick={audio.join}>{audio.blocked ? "Click to join the music" : "Rejoin synchronized music"}</button>}
        {searchMode ? <>
          {track && <button type="button" className="music-back" onClick={() => setSearching(false)}>← Back to now playing</button>}
          <MusicSearch channelId={music.channelId} canControl={isDJ} canStart={music.canStart} busy={busy || music.reconnecting} onCommand={send} active={!minimized} />
          {!track && session && session.queue.length > 0 && <MusicQueue session={session} disabled={disabled} command={command} />}
        </> : <>
          <div className="music-now-playing"><MusicArtwork track={track} large /><div><a href={track.permalink} target="_blank" rel="noreferrer" title="Open on YouTube">{track.title}</a><p>{track.artist}</p><span className="music-added">Added by {track.addedBy.name}</span></div></div>
          <MusicProgress session={session!} clockOffset={music.clockOffset} disabled={disabled} command={command} active={!minimized} />
          <div className="music-controls"><button type="button" className="music-icon-button" disabled={disabled} aria-label="Restart track" onClick={() => void command({ type: "restart" })}><MusicIcon name="restart" /></button>
            <button type="button" className="music-play-button" disabled={disabled} aria-label={session?.state === "PLAYING" ? "Pause music" : "Play music"} onClick={() => void command({ type: session?.state === "PLAYING" ? "pause" : "play" })}><MusicIcon name={session?.state === "PLAYING" ? "pause" : "play"} /></button>
            <button type="button" className="music-icon-button" disabled={disabled} aria-label="Next track" onClick={() => void command({ type: "next" })}><MusicIcon name="next" /></button></div>
          <MusicVolumeControl />
          <MusicQueue session={session!} disabled={disabled} command={command} />
          <button type="button" className="music-add-song" onClick={() => setSearching(true)}><MusicIcon name="plus" />Add song to queue</button>
        </>}
        {session && <footer className="music-footer"><span>{session.djName ? `${isDJ ? "You are" : session.djName + " is"} the room DJ` : "First to play becomes the room DJ"}</span>
          <label><input type="checkbox" checked={session.autoplay} disabled={disabled} onChange={(event) => void command({ type: "autoplay", enabled: event.target.checked })} /> Autoplay related songs</label></footer>}
      </div>
    </div>
  </div>, document.body);
}
