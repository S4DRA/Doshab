import { NextResponse } from "next/server";

import {
  getDashboardMessageThreads,
  getDashboardSidebarGroups,
} from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ groups: [] }, { status: 401 });
  }

  const [currentUser, groups, messageThreads, friendships] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    }),
    getDashboardSidebarGroups(session.userId),
    getDashboardMessageThreads(session.userId),
    prisma.friendship.findMany({
      where: {
        OR: [
          { userOneId: session.userId },
          { userTwoId: session.userId },
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
        userId: session.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 12,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        readAt: true,
        createdAt: true,
        actor: {
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
    prisma.notification.count({
      where: {
        readAt: null,
        userId: session.userId,
      },
    }),
  ]);
  const friends = friendships.map((friendship) =>
    friendFromPair(friendship, session.userId),
  );

  return NextResponse.json({
    currentUser,
    friends,
    groups,
    messageThreads,
    notifications,
    unreadCount,
  });
}
