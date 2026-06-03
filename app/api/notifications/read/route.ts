import { NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type ReadNotificationsBody = {
  href?: unknown;
  ids?: unknown;
};

export async function POST(request: Request) {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (auth.status !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as ReadNotificationsBody | null;
  const ids = Array.isArray(body?.ids)
    ? body.ids.filter((id): id is string => typeof id === "string")
    : [];
  const href = typeof body?.href === "string" ? body.href : "";

  await prisma.notification.updateMany({
    where: {
      ...(ids.length ? { id: { in: ids } } : {}),
      ...(href ? { href } : {}),
      readAt: null,
      userId: auth.user.id,
    },
    data: {
      readAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
