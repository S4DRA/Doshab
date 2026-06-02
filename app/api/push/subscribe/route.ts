import { NextRequest, NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PushSubscriptionBody = {
  endpoint?: unknown;
  keys?: {
    auth?: unknown;
    p256dh?: unknown;
  };
};

export async function POST(request: NextRequest) {
  const authState = await getAuthState();

  if (authState.status === "unverified") {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (authState.status !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = authState.user.id;

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
      userId,
    },
    update: {
      auth,
      p256dh,
      userAgent: request.headers.get("user-agent"),
      userId,
    },
  });

  return NextResponse.json({ ok: true });
}
