import { NextRequest, NextResponse } from "next/server";

import { dashboardNotificationSelect } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/security/permissions";
import { rateLimit } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const user = await requireAuth().catch(() => null);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limited = await rateLimit(request, {
    identifiers: [`user:${user.id}`],
    key: "notifications:poll",
    limit: 120,
    windowMs: 60_000,
  });

  if (limited) {
    return limited;
  }

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        OR: [
          { expiresAt: null },
          {
            expiresAt: {
              gt: new Date(),
            },
          },
        ],
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      select: dashboardNotificationSelect,
    }),
    prisma.notification.count({
      where: {
        readAt: null,
        userId: user.id,
      },
    }),
  ]);

  return NextResponse.json({
    notifications,
    serverTime: new Date().toISOString(),
    unreadCount,
  });
}
