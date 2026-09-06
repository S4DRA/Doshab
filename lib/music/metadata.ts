import type { MusicSession } from "./types";

// Only consume LiveKit's server-owned room metadata, never participant data messages.
export function musicSessionFromMetadata(raw: string): MusicSession | null {
  try {
    const value = JSON.parse(raw)?.valMusicV1 as MusicSession | undefined;
    if (!value || typeof value.roomId !== "string" || !Number.isSafeInteger(value.version) || value.version < 0 ||
      !["PLAYING", "PAUSED", "STOPPED"].includes(value.state) || !Number.isFinite(value.position) || !Number.isFinite(value.startedAt) ||
      !Array.isArray(value.queue) || value.queue.length > 30 || !Array.isArray(value.recentlyPlayed) || !Array.isArray(value.commandIds)) return null;
    for (const track of [...value.queue, ...(value.track ? [value.track] : [])]) {
      if (!track || track.provider !== "youtube" || !/^[a-zA-Z0-9_-]{11}$/.test(track.id) ||
        typeof track.queueId !== "string" || typeof track.title !== "string" || typeof track.artist !== "string" ||
        !Number.isFinite(track.duration) || track.duration <= 0 || !Array.isArray(track.artworkMirrors) ||
        !track.addedBy || typeof track.addedBy.name !== "string") return null;
    }
    return value;
  } catch { return null; }
}
