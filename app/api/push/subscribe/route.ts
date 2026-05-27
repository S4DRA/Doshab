import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

type PushSubscriptionBody = {
  endpoint?: unknown;
  keys?: {
    auth?: unknown;
    p256dh?: unknown;
  };
};

export async function POST(request: NextRequest) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as PushSubscriptionBody | null;
  const endpoint = typeof body?.endpoint === "string" ? body.endpoint : "";
  const auth = typeof body?.keys?.auth === "string" ? body.keys.auth : "";
  const p256dh = typeof body?.keys?.p256dh === "string" ? body.keys.p256dh : "";

  if (!endpoint || !auth || !p256dh) {
    return NextResponse.json({ error: "Invalid push subscription" }, { status: 400 });
  }

  await prisma.pushSubscription.upsert({
    where: {
      endpoint,
    },
    create: {
      auth,
      endpoint,
      p256dh,
      userAgent: request.headers.get("user-agent"),
      userId: session.userId,
    },
    update: {
      auth,
      p256dh,
      userAgent: request.headers.get("user-agent"),
      userId: session.userId,
    },
  });

  return NextResponse.json({ ok: true });
}
