import { NextResponse } from "next/server";

import { getDashboardSidebarGroups } from "@/lib/dashboard-data";
import { getAuthState } from "@/lib/auth";
import { friendFromPair } from "@/lib/friends";
import { dashboardNotificationSelect } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const auth = await getAuthState({ includeImage: true });

  if (auth.status === "unverified") {
    return NextResponse.json({ groups: [] }, { status: 403 });
  }

  if (auth.status !== "authenticated") {
    return NextResponse.json({ groups: [] }, { status: 401 });
  }

  const userId = auth.user.id;

  const [currentUser, groups, friendships] = await Promise.all([
    Promise.resolve({
      id: auth.user.id,
      name: auth.user.name,
      email: auth.user.email,
      image: auth.user.image,
    }),
    getDashboardSidebarGroups(userId),
    prisma.friendship.findMany({
      where: {
        OR: [
          { userOneId: userId },
          { userTwoId: userId },
        ],
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        userOneId: true,
        userTwoId: true,
        userOne: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            status: true,
          },
        },
      },
    }),
  ]);
  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      select: dashboardNotificationSelect,
    }),
    prisma.notification.count({
      where: {
        readAt: null,
        userId,
      },
    }),
  ]);
  const friends = friendships.map((friendship) =>
    friendFromPair(friendship, userId),
  );

  return NextResponse.json({
    currentUser,
    friends,
    groups,
    notifications,
    unreadCount,
  });
}
