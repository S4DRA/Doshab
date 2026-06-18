import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/security/rate-limit";
import { requireAuth } from "@/lib/security/permissions";

const deviceKeySchema = z.object({
  deviceId: z.string().trim().min(1).max(160),
  publicKey: z.string().trim().min(1).max(4000),
});

export async function POST(request: NextRequest) {
  const limited = await rateLimit(request, {
    key: "e2ee:device-key",
    limit: 30,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = deviceKeySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid device key" }, { status: 400 });
  }

  const { deviceId, publicKey } = parsed.data;

  await prisma.userDeviceKey.upsert({
    where: {
      id: deviceId,
    },
    create: {
      id: deviceId,
      publicKey,
      userAgent: request.headers.get("user-agent"),
      userId: user.id,
    },
    update: {
      lastSeen: new Date(),
      publicKey,
      userAgent: request.headers.get("user-agent"),
      userId: user.id,
    },
  });

  return NextResponse.json({ ok: true });
}
