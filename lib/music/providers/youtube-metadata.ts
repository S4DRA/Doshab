import { z } from "zod";
import type { MusicTrack } from "../types";

export const youtubeIdPattern = /^[a-zA-Z0-9_-]{11}$/;

export function youtubeVideoId(value: string): string | null {
  if (youtubeIdPattern.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.username || url.password) return null;
    const host = url.hostname.toLowerCase();
    const id = host === "youtu.be" ? url.pathname.slice(1).split("/")[0] :
      ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"].includes(host)
        ? url.pathname === "/watch" ? url.searchParams.get("v") : /^\/(shorts|embed)\//.test(url.pathname) ? url.pathname.split("/")[2] : null
        : null;
    return id && youtubeIdPattern.test(id) ? id : null;
  } catch { return null; }
}

export function youtubeDuration(value: string): number {
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(value);
  if (!match) return 0;
  return Number(match[1] ?? 0) * 86400 + Number(match[2] ?? 0) * 3600 + Number(match[3] ?? 0) * 60 + Number(match[4] ?? 0);
}

const videoSchema = z.object({
  id: z.string().regex(youtubeIdPattern),
  snippet: z.object({ title: z.string().max(500), channelTitle: z.string().max(200), channelId: z.string().max(128),
    categoryId: z.string(), liveBroadcastContent: z.string().optional(),
    thumbnails: z.record(z.string(), z.object({ url: z.string() })).optional() }),
  contentDetails: z.object({ duration: z.string(), contentRating: z.object({ ytRating: z.string().optional() }).optional(),
    regionRestriction: z.object({ allowed: z.array(z.string()).optional(), blocked: z.array(z.string()).optional() }).optional() }),
  status: z.object({ embeddable: z.boolean(), privacyStatus: z.string(), uploadStatus: z.string().optional() }),
});

export function normalizeYouTubeVideo(value: unknown, region?: string): MusicTrack | null {
  const parsed = videoSchema.safeParse(value);
  if (!parsed.success) return null;
  const video = parsed.data;
  const duration = youtubeDuration(video.contentDetails.duration);
  if (!video.status.embeddable || !["public", "unlisted"].includes(video.status.privacyStatus) || video.snippet.categoryId !== "10" ||
      (video.status.uploadStatus && video.status.uploadStatus !== "processed") ||
      (video.snippet.liveBroadcastContent && video.snippet.liveBroadcastContent !== "none") ||
      video.contentDetails.contentRating?.ytRating === "ytAgeRestricted" || duration <= 0 || duration > 14400) return null;
  const restriction = video.contentDetails.regionRestriction;
  if (region && (restriction?.blocked?.includes(region) || (restriction?.allowed && !restriction.allowed.includes(region)))) return null;
  const thumbnails = video.snippet.thumbnails;
  let artwork: string | null = null;
  const thumbnail = thumbnails?.medium?.url ?? thumbnails?.default?.url;
  if (thumbnail) {
    try { const url = new URL(thumbnail); if (url.protocol === "https:" && !url.username && !url.password) artwork = url.href; } catch { /* Missing artwork uses the music icon. */ }
  }
  return { provider: "youtube", id: video.id, title: video.snippet.title, artist: video.snippet.channelTitle,
    channelId: video.snippet.channelId, duration, genre: "Music", artwork, artworkMirrors: [],
    permalink: `https://www.youtube.com/watch?v=${video.id}` };
}
