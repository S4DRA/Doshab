export type MediaSource = "mic" | "camera" | "screen" | "screen-audio";
export type MediaParticipant = { userId: string; metadata?: { name?: string; email?: string }; speaking: boolean; muted: boolean };
export type LocalMedia = { kind: "audio" | "video"; source: MediaSource; track: MediaStreamTrack };
export type RemoteMedia = { consumerId: string; producerId: string; userId: string; source: MediaSource; kind: "audio" | "video"; track: MediaStreamTrack };
export type MediaConnectionState = "disconnected" | "connecting" | "connected" | "failed";
