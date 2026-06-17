import type { Prisma } from "@/lib/generated/prisma/client";

export type VoiceInputMode = "voice_activity" | "push_to_talk";

export type VoiceSettings = {
  inputDeviceId: string | null;
  outputDeviceId: string | null;
  inputVolume: number;
  outputVolume: number;
  inputMode: VoiceInputMode;
  autoSensitivity: boolean;
  sensitivity: number;
  pushToTalkKey: string | null;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  voiceIsolation: boolean;
  attenuation: number;
  joinMuted: boolean;
  joinDeafened: boolean;
  showVoiceWarnings: boolean;
  showSpeakingIndicators: boolean;
};

export const defaultVoiceSettings: VoiceSettings = {
  inputDeviceId: null,
  outputDeviceId: null,
  inputVolume: 100,
  outputVolume: 100,
  inputMode: "voice_activity",
  autoSensitivity: true,
  sensitivity: 55,
  pushToTalkKey: null,
  noiseSuppression: true,
  echoCancellation: true,
  autoGainControl: true,
  voiceIsolation: false,
  attenuation: 0,
  joinMuted: false,
  joinDeafened: false,
  showVoiceWarnings: true,
  showSpeakingIndicators: true,
};

export type VoiceSettingsRecord = {
  inputDeviceId: string | null;
  outputDeviceId: string | null;
  inputVolume: number;
  outputVolume: number;
  inputMode: string;
  autoSensitivity: boolean;
  sensitivity: number;
  pushToTalkKey: string | null;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  autoGainControl: boolean;
  voiceIsolation: boolean;
  attenuation: number;
  joinMuted: boolean;
  joinDeafened: boolean;
  showVoiceWarnings: boolean;
  showSpeakingIndicators: boolean;
};

export function serializeVoiceSettings(
  settings?: VoiceSettingsRecord | null,
): VoiceSettings {
  if (!settings) {
    return defaultVoiceSettings;
  }

  return {
    inputDeviceId: settings.inputDeviceId,
    outputDeviceId: settings.outputDeviceId,
    inputVolume: clampPercent(settings.inputVolume, defaultVoiceSettings.inputVolume),
    outputVolume: clampPercent(settings.outputVolume, defaultVoiceSettings.outputVolume),
    inputMode: settings.inputMode === "push_to_talk" ? "push_to_talk" : "voice_activity",
    autoSensitivity: settings.autoSensitivity,
    sensitivity: clampPercent(settings.sensitivity, defaultVoiceSettings.sensitivity),
    pushToTalkKey: normalizeNullableString(settings.pushToTalkKey, 40) ?? null,
    noiseSuppression: settings.noiseSuppression,
    echoCancellation: settings.echoCancellation,
    autoGainControl: settings.autoGainControl,
    voiceIsolation: settings.voiceIsolation,
    attenuation: clampPercent(settings.attenuation, defaultVoiceSettings.attenuation),
    joinMuted: settings.joinMuted,
    joinDeafened: settings.joinDeafened,
    showVoiceWarnings: settings.showVoiceWarnings,
    showSpeakingIndicators: settings.showSpeakingIndicators,
  };
}

export function parseVoiceSettingsPatch(
  payload: unknown,
): { data: Prisma.UserVoiceSettingsUpdateInput; settings: VoiceSettings } | { error: string } {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { error: "Voice settings payload must be an object." };
  }

  const patch = payload as Partial<Record<keyof VoiceSettings, unknown>>;
  const data: Prisma.UserVoiceSettingsUpdateInput = {};
  const next = { ...defaultVoiceSettings };

  const stringFields = [
    "inputDeviceId",
    "outputDeviceId",
    "pushToTalkKey",
  ] as const;

  for (const field of stringFields) {
    if (!(field in patch)) {
      continue;
    }

    const value = normalizeNullableString(patch[field], field === "pushToTalkKey" ? 40 : 180);

    if (value === undefined) {
      return { error: `${field} must be a string or null.` };
    }

    data[field] = value;
    next[field] = value;
  }

  const numberFields = [
    "inputVolume",
    "outputVolume",
    "sensitivity",
    "attenuation",
  ] as const;

  for (const field of numberFields) {
    if (!(field in patch)) {
      continue;
    }

    const value = parsePercent(patch[field]);

    if (value === null) {
      return { error: `${field} must be a number from 0 to 100.` };
    }

    data[field] = value;
    next[field] = value;
  }

  if ("inputMode" in patch) {
    if (patch.inputMode !== "voice_activity" && patch.inputMode !== "push_to_talk") {
      return { error: "inputMode must be voice_activity or push_to_talk." };
    }

    data.inputMode = patch.inputMode;
    next.inputMode = patch.inputMode;
  }

  const booleanFields = [
    "autoSensitivity",
    "noiseSuppression",
    "echoCancellation",
    "autoGainControl",
    "voiceIsolation",
    "joinMuted",
    "joinDeafened",
    "showVoiceWarnings",
    "showSpeakingIndicators",
  ] as const;

  for (const field of booleanFields) {
    if (!(field in patch)) {
      continue;
    }

    if (typeof patch[field] !== "boolean") {
      return { error: `${field} must be a boolean.` };
    }

    data[field] = patch[field];
    next[field] = patch[field];
  }

  return { data, settings: next };
}

export function getVoiceSettingsCreateData(
  userId: string,
  patch?: Prisma.UserVoiceSettingsUpdateInput,
): Prisma.UserVoiceSettingsCreateInput {
  const merged = {
    ...defaultVoiceSettings,
    ...patch,
  } as VoiceSettings;

  return {
    autoGainControl: merged.autoGainControl,
    autoSensitivity: merged.autoSensitivity,
    attenuation: merged.attenuation,
    echoCancellation: merged.echoCancellation,
    inputDeviceId: merged.inputDeviceId,
    inputMode: merged.inputMode,
    inputVolume: merged.inputVolume,
    joinDeafened: merged.joinDeafened,
    joinMuted: merged.joinMuted,
    noiseSuppression: merged.noiseSuppression,
    outputDeviceId: merged.outputDeviceId,
    outputVolume: merged.outputVolume,
    pushToTalkKey: merged.pushToTalkKey,
    sensitivity: merged.sensitivity,
    showSpeakingIndicators: merged.showSpeakingIndicators,
    showVoiceWarnings: merged.showVoiceWarnings,
    user: {
      connect: {
        id: userId,
      },
    },
    voiceIsolation: merged.voiceIsolation,
  };
}

function parsePercent(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return clampPercent(value, 0);
}

function clampPercent(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeNullableString(value: unknown, maxLength: number) {
  if (value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, maxLength);
}
