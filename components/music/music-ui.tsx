"use client";

import { useState } from "react";
import type { MusicTrack } from "@/lib/music/types";

export function musicTime(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

type IconName = "music" | "youtube" | "search" | "plus" | "close" | "minimize" | "expand" | "play" | "pause" | "next" | "restart" | "volume" | "muted" | "more" | "grip";
export function MusicIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    youtube: <><rect x="2" y="5" width="20" height="14" rx="4" fill="#ff0033" stroke="none" /><path d="m10 9 6 3-6 3Z" fill="white" stroke="none" /></>,
    music: <><path d="M9 18V5l11-2v13M9 8l11-2" /><ellipse cx="6" cy="18" rx="3" ry="2" /><ellipse cx="17" cy="16" rx="3" ry="2" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    plus: <path d="M12 5v14M5 12h14" />, close: <path d="m6 6 12 12M6 18 18 6" />,
    minimize: <path d="M5 12h14" />, expand: <path d="m5 15 7-7 7 7" />,
    play: <path d="m8 5 11 7-11 7Z" fill="currentColor" />,
    pause: <path d="M8 5v14M16 5v14" strokeWidth="4" />,
    next: <><path d="m5 5 10 7L5 19Z" fill="currentColor" /><path d="M19 5v14" /></>,
    restart: <><path d="m19 5-10 7 10 7Z" fill="currentColor" /><path d="M5 5v14" /></>,
    volume: <><path d="m11 5-5 4H3v6h3l5 4ZM15 8a6 6 0 0 1 0 8M18 5a10 10 0 0 1 0 14" /></>,
    muted: <><path d="m11 5-5 4H3v6h3l5 4ZM16 9l6 6m-6 0 6-6" /></>,
    more: <><circle cx="12" cy="5" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="12" cy="19" r="1" /></>,
    grip: <path d="M8 5h1m6 0h1M8 12h1m6 0h1M8 19h1m6 0h1" strokeWidth="3" />,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export function MusicArtwork({ track, large = false }: { track: MusicTrack; large?: boolean }) {
  return <Artwork key={`${track.id}:${track.artwork}`} track={track} large={large} />;
}
function Artwork({ track, large }: { track: MusicTrack; large: boolean }) {
  const [attempt, setAttempt] = useState(0);
  let source = track.artwork;
  if (attempt > 0 && source && track.artworkMirrors[attempt - 1]) {
    const original = new URL(source); const mirror = new URL(track.artworkMirrors[attempt - 1]);
    original.host = mirror.host; source = original.href;
  }
  if (attempt > track.artworkMirrors.length) source = null;
  return <span className={`music-artwork${large ? " music-artwork-large" : ""}`}>
    {source ? /* Provider thumbnails are rendered without cropping or alterations. */
      // eslint-disable-next-line @next/next/no-img-element
      <img src={source} alt="" loading="lazy" width={large ? 104 : 44} height={large ? 104 : 44} referrerPolicy="no-referrer" onError={() => setAttempt((value) => value + 1)} /> : <MusicIcon name="music" />}
  </span>;
}
