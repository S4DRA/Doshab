"use client";

import { defaultVoiceSettings, type VoiceSettings } from "@/lib/voice-settings";

export async function loadVoiceSettingsForCall(): Promise<VoiceSettings> {
  const cached = readCachedVoiceSettings();

  try {
    const response = await fetch("/api/profile/voice-settings", {
      cache: "no-store",
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      return cached;
    }

    const data = (await response.json().catch(() => null)) as {
      settings?: VoiceSettings;
    } | null;

    if (!data?.settings) {
      return cached;
    }

    cacheVoiceSettings(data.settings);
    return {
      ...defaultVoiceSettings,
      ...data.settings,
    };
  } catch {
    return cached;
  }
}

export function readCachedVoiceSettings() {
  if (typeof window === "undefined") {
    return defaultVoiceSettings;
  }

  try {
    const value = window.localStorage.getItem("valVoiceSettings");
    const parsed = value ? (JSON.parse(value) as Partial<VoiceSettings>) : null;

    return {
      ...defaultVoiceSettings,
      ...parsed,
    };
  } catch {
    window.localStorage.removeItem("valVoiceSettings");
    return defaultVoiceSettings;
  }
}

export function cacheVoiceSettings(settings: VoiceSettings) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem("valVoiceSettings", JSON.stringify(settings));
  } catch {
    // Cache misses should never block joining a voice room.
  }
}
