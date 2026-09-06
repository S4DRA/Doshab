"use client";

import { useEffect, useRef, useState } from "react";
import type { MusicCommand, MusicTrack } from "@/lib/music/types";
import { MusicArtwork, MusicIcon, musicTime } from "./music-ui";

export function MusicSearch({ channelId, canControl, canStart, busy, onCommand, active }: {
  channelId: string; canControl: boolean; canStart: boolean; busy: boolean;
  onCommand: (command: MusicCommand) => Promise<boolean>;
  active: boolean;
}) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const cache = useRef(new Map<string, { tracks: MusicTrack[]; expires: number }>());

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const q = query.trim();
    const timer = setTimeout(async () => {
      setError(null); setMenu(null);
      if (q.length === 1) { setTracks([]); setLoading(false); return; }
      const cached = cache.current.get(q);
      if (cached && cached.expires > Date.now()) { setTracks(cached.tracks); setLoading(false); return; }
      setLoading(true);
      try {
        const response = await fetch(`/api/music/${encodeURIComponent(channelId)}/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Music search is temporarily unavailable.");
        cache.current.set(q, { tracks: data.tracks, expires: Date.now() + 60000 });
        if (cache.current.size > 20) cache.current.delete(cache.current.keys().next().value!);
        setTracks(data.tracks);
      } catch (failure) {
        if (!controller.signal.aborted) { setTracks([]); setError(failure instanceof Error ? failure.message : "Music search is temporarily unavailable."); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, channelId, active]);

  const add = async (track: MusicTrack, type: "playNow" | "addNext" | "enqueue") => {
    if (await onCommand({ type, provider: track.provider, trackId: track.id })) {
      setMenu(null); setAnnouncement(type === "playNow" ? `Playing ${track.title}` : `${track.title} added to queue`);
    }
  };

  return <div className="music-search">
    <label className="music-search-field"><MusicIcon name="search" /><input autoFocus aria-label="Search music" maxLength={120}
      placeholder="Search music or paste a YouTube Music link..." value={query} onChange={(event) => { setQuery(event.target.value); setLoading(true); }} /></label>
    <div className="music-provider"><span><MusicIcon name="youtube" /> YouTube</span><small>Music videos · Official player</small></div>
    <h3>{query.trim().length >= 2 ? "Music search results" : "Popular music on YouTube"}</h3>
    <p className="music-sr-only" role="status">{announcement}</p>
    {loading ? <div aria-label="Searching music" aria-busy="true" className="music-skeletons">{[0,1,2,3].map((i) => <div key={i}><span /><span /></div>)}</div> :
      error ? <p role="alert" className="music-error">{error}</p> : tracks.length === 0 ? <p className="music-empty">{query.trim().length === 1 ? "Enter at least two characters." : query ? "No tracks found." : "Search for something to play together."}</p> :
      <ul className="music-track-list">{tracks.map((track) => <li key={track.id}>
        <div className="music-track-row"><MusicArtwork track={track} /><div className="music-track-text"><span title={track.title}>{track.title}</span><small>{track.artist}</small></div><time>{musicTime(track.duration)}</time>
          <button type="button" className="music-icon-button" disabled={busy} aria-expanded={menu === track.id} aria-label={`Actions for ${track.title}`} onClick={() => setMenu(menu === track.id ? null : track.id)}><MusicIcon name="plus" /></button>
        </div>
        {menu === track.id && <div className="music-row-actions">
          {(canControl || canStart) && <button type="button" disabled={busy} onClick={() => void add(track, "playNow")}>Play now</button>}
          {canControl && <button type="button" disabled={busy} onClick={() => void add(track, "addNext")}>Add next</button>}
          <button type="button" disabled={busy} onClick={() => void add(track, "enqueue")}>Add to queue</button>
        </div>}
      </li>)}</ul>}
    <p className="music-footnote">Plays through YouTube. Keep the video visible to listen; ads and regional restrictions may apply.</p>
  </div>;
}
