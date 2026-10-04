"use client";

import dynamic from "next/dynamic";
import { MusicErrorBoundary, useMusicSession } from "./music-session-provider";
import { MusicIcon } from "./music-ui";
import "./music.css";

const ListenTogetherPopover = dynamic(() => import("./listen-together-popover").then((m) => m.ListenTogetherPopover), { ssr: false });

export function MusicButton({ onOpen }: { onOpen?: () => void } = {}) {
  const music = useMusicSession();
  if (!music) return null;
  const { playerView: view, setPlayerView: setView, playerAnchor } = music;
  return <MusicErrorBoundary><div className="music-button-anchor">
    <button ref={playerAnchor} type="button" className={`music-launch-button${music.session?.state === "PLAYING" ? " is-playing" : ""}`}
      title="Listen Together" aria-label="Listen Together" aria-haspopup="dialog" aria-expanded={view !== "closed"}
      onClick={() => { if (view === "closed") music.refreshNow(); setView(view === "expanded" ? "closed" : "expanded"); if (view !== "expanded") onOpen?.(); }}><MusicIcon name="music" /></button>
  </div></MusicErrorBoundary>;
}

/** One player lives beside the persistent call, so navigating never recreates playback. */
export function PersistentMusicPlayer() {
  const music = useMusicSession();
  if (!music || music.playerView === "closed") return null;
  return <MusicErrorBoundary><ListenTogetherPopover minimized={music.playerView === "minimized"}
    onExpand={() => music.setPlayerView("expanded")} onMinimize={() => music.setPlayerView("minimized")}
    onClose={() => music.setPlayerView("closed")} anchor={music.playerAnchor} /></MusicErrorBoundary>;
}
