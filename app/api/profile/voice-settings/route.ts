import { NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getVoiceSettingsCreateData,
  parseVoiceSettingsPatch,
  serializeVoiceSettings,
} from "@/lib/voice-settings";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  const settings = await prisma.userVoiceSettings.findUnique({
    where: {
      userId: user.id,
    },
  });

  return NextResponse.json({
    settings: serializeVoiceSettings(settings),
  });
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
}

export async function DELETE() {
  const user = await getCurrentUser();

  if (!user) {
    return jsonError("Authentication required.", 401);
  }

  await prisma.userVoiceSettings.deleteMany({
    where: {
      userId: user.id,
    },
  });

  return NextResponse.json({
    settings: serializeVoiceSettings(null),
  });
}
