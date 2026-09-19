"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { MusicCommand, MusicSearchPage, MusicTrack } from "@/lib/music/types";
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
  const [retry, setRetry] = useState(0);
  const [adding, setAdding] = useState<string | null>(null);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const moreRequest = useRef<AbortController | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const resultsId = useId();
  const cache = useRef(new Map<string, MusicSearchPage & { expires: number }>());

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    const q = query.trim();
    const timer = setTimeout(async () => {
      setError(null); setMenu(null); setMoreError(null); setLoadingMore(false);
      if (q.length === 1) { setTracks([]); setNextPageToken(null); setLoading(false); return; }
      const cacheKey = `${channelId}:${q}`;
      const cached = cache.current.get(cacheKey);
      if (cached && cached.expires > Date.now()) { setTracks(cached.tracks); setNextPageToken(cached.nextPageToken); setLoading(false); return; }
      setLoading(true);
      try {
        const response = await fetch(`/api/music/${encodeURIComponent(channelId)}/search?q=${encodeURIComponent(q)}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
        const data = await response.json();
        if (controller.signal.aborted) return;
        if (!response.ok) throw new Error(data.error ?? "Music search is temporarily unavailable.");
        cache.current.set(cacheKey, { tracks: data.tracks, nextPageToken: data.nextPageToken ?? null, expires: Date.now() + 60000 });
        if (cache.current.size > 20) cache.current.delete(cache.current.keys().next().value!);
        setTracks(data.tracks);
        setNextPageToken(data.nextPageToken ?? null);
      } catch (failure) {
        if (!controller.signal.aborted) { setTracks([]); setNextPageToken(null); setError(failure instanceof Error ? failure.message : "Music search is temporarily unavailable."); }
      } finally { if (!controller.signal.aborted) setLoading(false); }
    }, 350);
    return () => { clearTimeout(timer); controller.abort(); moreRequest.current?.abort(); moreRequest.current = null; };
  }, [query, channelId, active, retry]);

  const loadMore = async () => {
    if (!nextPageToken || loading || moreRequest.current || !active) return;
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true); setMoreError(null);
    const q = query.trim();
    try {
      const params = new URLSearchParams({ q, pageToken: nextPageToken });
      const response = await fetch(`/api/music/${encodeURIComponent(channelId)}/search?${params}`, { signal: AbortSignal.any([controller.signal, AbortSignal.timeout(15000)]) });
      const data = await response.json();
      if (controller.signal.aborted) return;
      if (!response.ok) throw new Error(data.error ?? "Could not load more songs. Try again.");
      const combined = [...new Map<string, MusicTrack>([...tracks, ...data.tracks].map((track: MusicTrack) => [track.id, track])).values()];
      const next = data.nextPageToken && data.nextPageToken !== nextPageToken ? data.nextPageToken : null;
      setTracks(combined); setNextPageToken(next);
      cache.current.set(`${channelId}:${q}`, { tracks: combined, nextPageToken: next, expires: Date.now() + 60000 });
    } catch (failure) {
      if (!controller.signal.aborted) setMoreError(failure instanceof Error ? failure.message : "Could not load more songs. Try again.");
    } finally {
      if (moreRequest.current === controller) { moreRequest.current = null; setLoadingMore(false); }
    }
  };

  const changeQuery = (value: string) => {
    moreRequest.current?.abort(); moreRequest.current = null;
    setQuery(value); setLoading(true); setAnnouncement(""); setMenu(null);
  };

  const add = async (track: MusicTrack, type: "playNow" | "addNext" | "enqueue") => {
    if (busy || adding) return;
    setAdding(track.id);
    try {
      if (await onCommand({ type, provider: track.provider, trackId: track.id })) {
        setMenu(null); setAnnouncement(type === "playNow" ? `Playing ${track.title}` : `${track.title} added ${type === "addNext" ? "next" : "to queue"}`);
      }
    } finally { setAdding(null); }
  };

  return <div className="music-search">
    <div className="music-search-toolbar">
    <div className="music-search-heading"><h3>Find a song</h3><span><MusicIcon name="youtube" />YouTube</span></div>
    <div className="music-search-field"><MusicIcon name="search" /><input ref={input} autoFocus={active} aria-label="Search music" aria-controls={resultsId} maxLength={120} type="search" autoComplete="off" spellCheck={false}
      placeholder="Song, artist, or YouTube link" value={query} onChange={(event) => changeQuery(event.target.value)} />
      {query && <button type="button" className="music-icon-button" aria-label="Clear music search" onClick={() => { changeQuery(""); input.current?.focus(); }}><MusicIcon name="close" /></button>}</div>
    <div className="music-search-results-heading"><span>{query.trim() ? "Search results" : "Popular music"}</span><span>{loading ? "Searching…" : `${tracks.length} songs${nextPageToken ? " · More available" : ""}`}</span></div>
    </div>
    <p className={announcement ? "music-search-feedback" : "music-sr-only"} role="status">{announcement}</p>
    <p className="music-sr-only" role="status">{loading ? "Searching music" : loadingMore ? "Loading more songs" : error ? "Search failed" : `${tracks.length} tracks loaded${nextPageToken ? ", more results available" : ""}`}</p>
    <div id={resultsId} aria-busy={loading}>
    {loading ? <div aria-label="Searching music" aria-busy="true" className="music-skeletons">{[0,1,2,3].map((i) => <div key={i}><span /><span /></div>)}</div> :
      error ? <div role="alert" className="music-error">{error}<button type="button" className="music-text-button" onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Try search again</button></div> : tracks.length === 0 ? <p className="music-empty">{query.trim().length === 1 ? "Enter at least two characters." : nextPageToken ? "No playable songs on this page. Load more results to keep looking." : query ? "No playable tracks found. Try a different song, artist, or a direct YouTube link." : "Search for something to play together."}</p> :
      <ul className="music-track-list">{tracks.map((track) => <li key={track.id}>
        <div className="music-track-row"><MusicArtwork track={track} /><div className="music-track-text"><span title={track.title}>{track.title}</span><small>{track.artist}</small></div><time>{musicTime(track.duration)}</time>
          <button type="button" className="music-icon-button" disabled={busy || !!adding} aria-label={canStart ? `Play ${track.title}` : `Add ${track.title} to queue`} title={canStart ? "Play now" : "Add to queue"} onClick={() => void add(track, canStart ? "playNow" : "enqueue")}><MusicIcon name={canStart ? "play" : "plus"} /></button>
          {canControl && <button type="button" className="music-icon-button" disabled={busy || !!adding} aria-expanded={menu === track.id} aria-label={`More actions for ${track.title}`} onClick={() => setMenu(menu === track.id ? null : track.id)}><MusicIcon name="more" /></button>}
        </div>
        {menu === track.id && <div className="music-row-actions" onKeyDown={(event) => { if (event.key === "Escape") { event.stopPropagation(); setMenu(null); event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(".music-track-row button:last-child")?.focus(); } }}>
          {(canControl || canStart) && <button type="button" disabled={busy} onClick={() => void add(track, "playNow")}>Play now</button>}
          {canControl && <button type="button" disabled={busy} onClick={() => void add(track, "addNext")}>Add next</button>}
          <button type="button" disabled={busy} onClick={() => void add(track, "enqueue")}>Add to queue</button>
        </div>}
      </li>)}</ul>}
    </div>
    {!loading && moreError && <p className="music-error" role="alert">{moreError}</p>}
    {!loading && nextPageToken && <button type="button" className="music-load-more" disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "Loading more songs…" : moreError ? "Retry loading more" : "Load more songs"}</button>}
    {!loading && !error && tracks.length > 0 && !nextPageToken && <p className="music-results-end">You’ve reached the end of these results.</p>}
    <p className="music-footnote">Plays through YouTube. Keep the video visible to listen; ads and regional restrictions may apply.</p>
  </div>;
}
