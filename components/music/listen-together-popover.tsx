"use client";

import { useEffect, useId, useLayoutEffect, useState, type RefObject } from "react";
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
  const autoplayHelpId = useId();

  const { panel, ...dragHandle } = usePlayerPosition(anchor);
  const { session, isDJ, canControl, busy, command } = music;
  const track = session?.track;
  const disabled = !canControl || busy || music.reconnecting;
  const searchMode = searching || !track;
  const status = music.reconnecting ? "Connecting" : audio.playbackError ? "Playback unavailable" : audio.blocked ? "Join to listen" : audio.localPaused ? "Locally paused" : session?.state === "PLAYING" ? "Playing together" : track ? "Paused" : "Ready to listen";

  useLayoutEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const node = panel.current;
    const trigger = anchor.current;
    return () => {
      if (!node?.contains(document.activeElement)) return;
      const target = trigger?.isConnected ? trigger : previous?.isConnected ? previous : null;
      target?.focus({ preventScroll: true });
    };
  }, [anchor, panel]);

  useEffect(() => {
    if (!minimized) panel.current?.focus();
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
      <button type="button" className="music-icon-button" aria-label="Close music player and stop audio for you only" title="Close · Stops audio for you only" onClick={onClose}><MusicIcon name="close" /></button>
    </header>
    {minimized && <div className="music-mini-summary">
      <button type="button" className="music-mini-track" onClick={onExpand} title={track?.title} aria-label="Expand track details">{track && <MusicArtwork track={track} />}<span><strong>{track?.title ?? "Pick your next song"}</strong><small>{track?.artist ?? "Open search to start listening"}</small></span></button>
      <span className="music-mini-state">{status}</span>
      {track && <button type="button" className="music-mini-mobile-queue val-mobile-only" aria-label={`Open music queue, ${session?.queue.length ?? 0} songs`} onClick={() => { setSearching(true); onExpand(); }}><MusicIcon name="plus" /><span>{session?.queue.length ?? 0}</span></button>}
    </div>}    {track && <MusicErrorBoundary><YouTubePlayback /></MusicErrorBoundary>}
    {minimized && track && <div className="music-mini-mobile-controls val-mobile-only" role="group" aria-label="Music playback controls">
      <button type="button" className="music-play-button" disabled={disabled} aria-label={audio.blocked || audio.localPaused ? "Join room music" : session?.state === "PLAYING" ? "Pause music" : "Play music"} onClick={() => { if (audio.blocked || audio.localPaused) audio.join(); else void command({ type: session?.state === "PLAYING" ? "pause" : "play" }); }}><MusicIcon name={!audio.blocked && !audio.localPaused && session?.state === "PLAYING" ? "pause" : "play"} /></button>
      <button type="button" className="music-icon-button" disabled={disabled} aria-label="Next track" onClick={() => void command({ type: "next" })}><MusicIcon name="next" /></button>
      <button type="button" className="music-icon-button" aria-label="Expand music player" onClick={onExpand}><MusicIcon name="expand" /></button>
      <button type="button" className="music-icon-button" aria-label="Close music player and stop audio for you only" onClick={onClose}><MusicIcon name="close" /></button>
    </div>}
    {minimized && track && (music.error || session?.notice) && <div className="music-mini-mobile-messages val-mobile-only">
      {music.error && <p className="music-error" role="alert">{music.error}</p>}
      {session?.notice && <p className="music-notice" role="status">{session.notice}</p>}
    </div>}
    {minimized && <div className="music-mini-tools">
      {session?.track && <MusicProgress session={session} clockOffset={music.clockOffset} disabled={disabled} command={command} active={minimized} />}
      <MusicMiniControls disabled={disabled || !track} playing={session?.state === "PLAYING"} command={command} onAdd={() => { setSearching(true); onExpand(); }} queueCount={session?.queue.length ?? 0} />
      {session && <p className="music-control-hint">Room controls are shared. Volume is just for you.</p>}
      {music.error && <p className="music-error" role="alert">{music.error}</p>}
      {session?.notice && <p className="music-notice" role="status">{session.notice}</p>}
    </div>}
    <div className="music-expanded" hidden={minimized}>
      <div className="music-scroll">
        {music.reconnecting && <p className="music-notice" role="status">Reconnecting to room music…</p>}
        {music.error && <p className="music-error" role="alert">{music.error}</p>}
        {session?.notice && <p className="music-notice" role="status">{session.notice}</p>}
        {audio.playbackError && <p className="music-error" role="alert">{audio.playbackError} Try the next track.</p>}
        {(audio.blocked || audio.localPaused) && <button type="button" className="music-join" onClick={audio.join}>{audio.blocked ? "Click to join the music" : "Rejoin synchronized music"}</button>}
        {searchMode ? <>
          {track && <button type="button" className="music-back" onClick={() => setSearching(false)}>← Back to now playing</button>}
          <MusicSearch channelId={music.channelId} canControl={canControl} canStart={music.canStart} busy={busy || music.reconnecting} onCommand={send} active={!minimized} />
          {!track && session && session.queue.length > 0 && <MusicQueue session={session} disabled={disabled} command={command} />}
        </> : <>
          <div className="music-playback-status" role="status"><span className={session?.state === "PLAYING" ? "music-status-dot is-playing" : "music-status-dot"} />{status}{busy && <span className="music-saving">Updating…</span>}</div>
          <div className="music-now-playing"><MusicArtwork track={track} large /><div><a href={track.permalink} target="_blank" rel="noreferrer" title="Open on YouTube">{track.title}</a><p>{track.artist}</p><span className="music-added">{track.addedBy.name === "Autoplay" && !track.addedBy.id ? "Autoplay discovery" : `Added by ${track.addedBy.name}`}</span>{track.genre !== "Music" && track.genre && <span className="music-genre">{track.genre}</span>}</div></div>
          <MusicProgress session={session!} clockOffset={music.clockOffset} disabled={disabled} command={command} active={!minimized} />
          <div className="music-controls"><button type="button" className="music-icon-button" disabled={disabled} aria-label="Restart track" onClick={() => void command({ type: "restart" })}><MusicIcon name="restart" /></button>
            <button type="button" className="music-play-button" disabled={disabled} aria-label={session?.state === "PLAYING" ? "Pause music" : "Play music"} onClick={() => void command({ type: session?.state === "PLAYING" ? "pause" : "play" })}><MusicIcon name={session?.state === "PLAYING" ? "pause" : "play"} /></button>
            <button type="button" className="music-icon-button" disabled={disabled} aria-label="Next track" onClick={() => void command({ type: "next" })}><MusicIcon name="next" /></button></div>
          <MusicVolumeControl />
          <p className="music-control-hint">Room controls are shared. Volume is just for you.</p>
          <MusicQueue session={session!} disabled={disabled} command={command} />
          <button type="button" className="music-add-song" onClick={() => setSearching(true)}><MusicIcon name="plus" />Add song to queue</button>
        </>}
        {session && <footer className="music-footer"><span>{session.djName ? `Started by ${isDJ ? "you" : session.djName}` : "Choose a song for the room"}</span>
          <div className={`music-autoplay${session.autoplay ? " is-enabled" : ""}`}><label><input type="checkbox" role="switch" aria-describedby={autoplayHelpId} checked={session.autoplay} disabled={disabled} onChange={(event) => void command({ type: "autoplay", enabled: event.target.checked })} /><strong>Autoplay discovery</strong><span>{session.autoplay ? "On" : "Off"}</span></label>
          <p id={autoplayHelpId}>Keep the same vibe with a shuffled mix of artists. Starts after your queue finishes.</p></div></footer>}
      </div>
    </div>
  </div>, document.body);
}
