import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security/permissions";

const readNotificationsSchema = z.object({
  href: z.string().max(500).optional(),
  ids: z.array(z.string().min(1).max(128)).max(100).optional(),
});

export async function POST(request: Request) {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = readNotificationsSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid notification request" }, { status: 400 });
  }

  const ids = parsed.data.ids ?? [];
  const href = parsed.data.href ?? "";

  await prisma.notification.updateMany({
    where: {
      ...(ids.length ? { id: { in: ids } } : {}),
      ...(href ? { href } : {}),
      readAt: null,
      userId: user.id,
    },
    data: {
      readAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}
