import { NextRequest, NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type DeviceKeyBody = {
  deviceId?: unknown;
  publicKey?: unknown;
};

export async function POST(request: NextRequest) {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (auth.status !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = auth.user.id;

  const body = (await request.json().catch(() => null)) as DeviceKeyBody | null;
  const deviceId = typeof body?.deviceId === "string" ? body.deviceId : "";
  const publicKey = typeof body?.publicKey === "string" ? body.publicKey : "";

  if (!deviceId || !publicKey || publicKey.length > 4000) {
    return NextResponse.json({ error: "Invalid device key" }, { status: 400 });
  }

  await prisma.userDeviceKey.upsert({
    where: {
      id: deviceId,
    },
    create: {
      id: deviceId,
      publicKey,
      userAgent: request.headers.get("user-agent"),
      userId,
    },
    update: {
      lastSeen: new Date(),
      publicKey,
      userAgent: request.headers.get("user-agent"),
      userId,
    },
  });

  return NextResponse.json({ ok: true });
}
