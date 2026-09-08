import { AudioPresets, type ScreenShareCaptureOptions, type TrackPublishOptions } from "livekit-client";

export const streamPresets = {
  balanced: { label: "Balanced · 1080p", width: 1920, height: 1080, bitrate: 4_000_000 },
  performance: { label: "Performance · 720p", width: 1280, height: 720, bitrate: 2_000_000 },
  quality: { label: "High quality · 1440p", width: 2560, height: 1440, bitrate: 8_000_000 },
} as const;

export type StreamSettings = {
  preset: keyof typeof streamPresets;
  frameRate: 15 | 30 | 60;
  content: "detail" | "motion";
  audio: "off" | "standard" | "high";
};

export const defaultStreamSettings: StreamSettings = {
  preset: "balanced", frameRate: 30, content: "motion", audio: "high",
};

export function getStreamOptions(settings: StreamSettings): {
  capture: ScreenShareCaptureOptions;
  publish: TrackPublishOptions;
} {
  const preset = streamPresets[settings.preset];
  return {
    capture: {
      resolution: { width: preset.width, height: preset.height, frameRate: settings.frameRate },
      audio: settings.audio !== "off" && {
        channelCount: 2, echoCancellation: false, noiseSuppression: false, autoGainControl: false,
      },
      contentHint: settings.content,
      selfBrowserSurface: "exclude",
      surfaceSwitching: "include",
      systemAudio: settings.audio === "off" ? "exclude" : "include",
    },
    publish: {
      videoCodec: "vp8",
      simulcast: true,
      screenShareEncoding: {
        maxBitrate: Math.round(preset.bitrate * (settings.frameRate / 30)),
        maxFramerate: settings.frameRate,
      },
      degradationPreference: settings.content === "detail" ? "maintain-resolution" : "maintain-framerate",
      audioPreset: settings.audio === "high" ? AudioPresets.musicHighQualityStereo : AudioPresets.musicStereo,
      forceStereo: true,
      dtx: false,
      red: true,
    },
  };
}
