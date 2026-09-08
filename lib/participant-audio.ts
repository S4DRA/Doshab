import { Track } from "livekit-client";

export function participantAudioVolume(source: Track.Source, preference: {
  localVolume: number;
  locallyMuted: boolean;
  streamVolume: number;
  streamMuted: boolean;
}) {
  const stream = source === Track.Source.ScreenShareAudio;
  if (stream ? preference.streamMuted : preference.locallyMuted) return 0;
  const volume = stream ? preference.streamVolume : preference.localVolume;
  return Number.isFinite(volume) ? Math.min(Math.max(volume / 100, 0), 1) : 1;
}
