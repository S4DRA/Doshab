export type MusicTrack = {
  provider: "youtube";
  id: string;
  title: string;
  artist: string;
  channelId?: string;
  artwork: string | null;
  artworkMirrors: string[];
  duration: number;
  genre: string;
  permalink: string;
};

export type QueueTrack = MusicTrack & { queueId: string; addedBy: { id: string; name: string } };
export type MusicSession = {
  roomId: string;
  version: number;
  state: "STOPPED" | "PLAYING" | "PAUSED";
  track: QueueTrack | null;
  position: number;
  startedAt: number;
  djUserId: string | null;
  djName: string | null;
  autoplay: boolean;
  queue: QueueTrack[];
  recentlyPlayed: string[];
  notice: string | null;
  commandIds: string[];
};

export type MusicCommand =
  | { type: "playNow" | "addNext" | "enqueue"; trackId: string; provider: "youtube" }
  | { type: "play" | "pause" | "restart" | "next" | "ended" | "clear" }
  | { type: "seek"; position: number }
  | { type: "autoplay"; enabled: boolean }
  | { type: "remove" | "moveNext" | "moveBottom"; queueId: string }
  | { type: "reorder"; queueIds: string[] };

export function expectedPosition(session: MusicSession, serverNow: number) {
  return Math.min(session.track?.duration ?? 0, Math.max(0, session.position +
    (session.state === "PLAYING" ? Math.max(0, serverNow - session.startedAt) / 1000 : 0)));
}

export function emptySession(roomId: string): MusicSession {
  return { roomId, version: 0, state: "STOPPED", track: null, position: 0, startedAt: 0,
    djUserId: null, djName: null, autoplay: false, queue: [], recentlyPlayed: [], notice: null, commandIds: [] };
}
