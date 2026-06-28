import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  defaultVoiceSettings,
  getVoiceSettingsCreateData,
  parseVoiceSettingsPatch,
  serializeVoiceSettings,
} from "@/lib/voice-settings";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function isMissingVoiceSettingsTableError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const prismaError = error as {
    code?: string;
    meta?: {
      modelName?: string;
    };
  };

  return prismaError.code === "P2021" && prismaError.meta?.modelName === "UserVoiceSettings";
}

function voiceSettingsStorageUnavailable() {
  return jsonError("Voice settings storage is unavailable. Run the database migration.", 503);
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  try {
    const settings = await prisma.userVoiceSettings.findUnique({
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      settings: serializeVoiceSettings(settings),
    });
  } catch (error) {
    if (!isMissingVoiceSettingsTableError(error)) {
      throw error;
    }

    console.error(
      "Voice settings table is missing; returning default settings until migrations are applied.",
      error,
    );

    return NextResponse.json({
      settings: defaultVoiceSettings,
      storageAvailable: false,
    });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const payload = await request.json().catch(() => null);
  const parsed = parseVoiceSettingsPatch(payload);

  if ("error" in parsed) {
    return jsonError(parsed.error, 400);
  }

  try {
    const settings = await prisma.userVoiceSettings.upsert({
      create: getVoiceSettingsCreateData(user.id, parsed.data),
      update: parsed.data,
      where: {
        userId: user.id,
      },
    });

    return NextResponse.json({
      settings: serializeVoiceSettings(settings),
    });
  } catch (error) {
    if (isMissingVoiceSettingsTableError(error)) {
      console.error(
        "Voice settings table is missing; cannot save settings until migrations are applied.",
        error,
      );

      return voiceSettingsStorageUnavailable();
    }

    throw error;
  }
}

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  try {
    await prisma.userVoiceSettings.deleteMany({
      where: {
        userId: user.id,
      },
    });
  } catch (error) {
    if (isMissingVoiceSettingsTableError(error)) {
      console.error(
        "Voice settings table is missing; cannot reset settings until migrations are applied.",
        error,
      );

      return voiceSettingsStorageUnavailable();
    }

    throw error;
  }

  return NextResponse.json({
    settings: serializeVoiceSettings(null),
  });
}
