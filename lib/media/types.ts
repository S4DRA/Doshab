export type MediaSource = "mic" | "camera" | "screen" | "screen-audio";
export type MediaParticipant = { instanceId?: string; userId: string; metadata?: { name?: string; email?: string }; speaking: boolean; muted: boolean; connectionState?: RTCPeerConnectionState };
export type LocalMedia = { kind: "audio" | "video"; source: MediaSource; track: MediaStreamTrack };
export type RemoteMedia = { consumerId: string; producerId: string; userId: string; source: MediaSource; kind: "audio" | "video"; track: MediaStreamTrack };
export type MediaConnectionState = "disconnected" | "connecting" | "connected" | "failed";
