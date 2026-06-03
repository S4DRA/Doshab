import { NextResponse } from "next/server";

import { getAuthState } from "@/lib/auth";
import { dashboardNotificationSelect } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    return NextResponse.json({ error: "Email not verified" }, { status: 403 });
  }

  if (auth.status !== "authenticated") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        userId: auth.user.id,
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
        userId: auth.user.id,
      },
    }),
  ]);

  return NextResponse.json({
    notifications,
    serverTime: new Date().toISOString(),
    unreadCount,
  });
}
