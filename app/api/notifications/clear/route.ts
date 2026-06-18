import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auditSecurityEvent, requireAuth } from "@/lib/security/permissions";

export async function POST(request: Request) {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.notification.deleteMany({
    where: {
      userId: user.id,
    },
  });

  await auditSecurityEvent(
    "notifications.clear",
    {
      actorId: user.id,
    },
    request,
  );

  return NextResponse.json({ ok: true });
}
