import "server-only";
import { z } from "zod";
import { MusicError } from "../state";
import type { MusicTrack } from "../types";
import type { MusicProvider } from "./provider";
import { normalizeYouTubeVideo, youtubeIdPattern, youtubeVideoId } from "./youtube-metadata";
import { discoveryQueries } from "../recommendations";

const apiRoot = "https://www.googleapis.com/youtube/v3/";
function region() {
  const value = process.env.YOUTUBE_REGION_CODE?.toUpperCase();
  return value && /^[A-Z]{2}$/.test(value) ? value : undefined;
}

async function request(path: "search" | "videos", params: Record<string, string>) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new MusicError("YouTube music search is not configured on this server.", 503);
  const url = new URL(path, apiRoot);
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  // Header keeps the server key out of URLs, browser payloads, and client caches.
  const response = await fetch(url, { headers: { "X-Goog-Api-Key": key }, signal: AbortSignal.timeout(6000), next: { revalidate: 300 } });
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) throw new MusicError("YouTube search is unavailable. The server API key or quota needs attention.", 503);
    throw new MusicError("YouTube music search is temporarily unavailable.", 503);
  }
  return z.object({ items: z.array(z.unknown()) }).parse(await response.json()).items;
}

async function videos(ids: string[]) {
  if (!ids.length) return [];
  const data = await request("videos", { part: "snippet,contentDetails,status,topicDetails", id: ids.join(","), maxResults: "50" });
  const tracks = data.map((video) => normalizeYouTubeVideo(video, region())).filter((track): track is MusicTrack => !!track);
  return ids.map((id) => tracks.find((track) => track.id === id)).filter((track): track is MusicTrack => !!track);
}

async function searchIds(query: string, limit = 10, language?: string) {
  const items = await request("search", { part: "snippet", type: "video", videoCategoryId: "10", videoEmbeddable: "true", videoSyndicated: "true",
    maxResults: String(limit), q: query, ...(language ? { relevanceLanguage: language.split("-")[0] } : {}), ...(region() ? { regionCode: region()! } : {}) });
  return items.map((item) => z.object({ id: z.object({ videoId: z.string().regex(youtubeIdPattern) }) }).safeParse(item))
    .flatMap((parsed) => parsed.success ? [parsed.data.id.videoId] : []);
}

async function search(query: string) {
  const direct = youtubeVideoId(query);
  return videos(direct ? [direct] : await searchIds(query));
}

async function browse() {
  const data = await request("videos", { part: "snippet,contentDetails,status,topicDetails", chart: "mostPopular", videoCategoryId: "10", maxResults: "10",
    ...(region() ? { regionCode: region()! } : {}) });
  return data.map((video) => normalizeYouTubeVideo(video, region())).filter((track): track is MusicTrack => !!track);
}

export const youtubeProvider: MusicProvider = {
  search,
  getTrack: async (id) => youtubeIdPattern.test(id) ? (await videos([id]))[0] ?? null : null,
  getTracks: (ids) => videos([...new Set(ids.filter((id) => youtubeIdPattern.test(id)))].slice(0, 10)),
  browse,
  getRelatedTracks: async (track) => {
    // Refresh pre-deployment tracks that only carried the generic "Music" genre.
    const seed = track.taste ? track : (await videos([track.id]))[0] ?? track;
    const results = await Promise.allSettled(discoveryQueries(seed).map((query) => searchIds(query, 25, seed.taste?.language)));
    const ids = [...new Set(results.flatMap((result) => result.status === "fulfilled" ? result.value : []))];
    if (!ids.length) {
      const failure = results.find((result) => result.status === "rejected");
      if (failure?.status === "rejected") throw failure.reason;
    }
    // One batch verifies availability and metadata for both discovery searches.
    return videos(ids.slice(0, 50));
  },
  // Only an official video embed: no audio extraction or media proxy.
  createPlaybackSource: (id) => `https://www.youtube.com/embed/${encodeURIComponent(id)}`,
};
