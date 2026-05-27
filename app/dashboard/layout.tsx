import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import {
  getDashboardSidebarGroups,
  getDashboardSession,
} from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDashboardSession();
  const sidebarData = session ? await getInitialSidebarData(session.userId) : null;

  return (
    <>
      <DashboardSidebar
        initialFriends={sidebarData?.friends}
        initialGroups={sidebarData?.groups}
        initialNotifications={sidebarData?.notifications}
        initialUnreadCount={sidebarData?.unreadCount}
      />
      <div className="min-w-0 overflow-hidden pl-14 sm:pl-16">{children}</div>
    </>
  );
}

async function getInitialSidebarData(userId: string) {
  const [groups, friendships, notifications, unreadCount] = await Promise.all([
    getDashboardSidebarGroups(userId),
    prisma.friendship.findMany({
      where: {
        OR: [{ userOneId: userId }, { userTwoId: userId }],
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
    prisma.notification.findMany({
      where: {
        userId,
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
        userId,
      },
    }),
  ]);

  return {
    friends: friendships.map((friendship) => friendFromPair(friendship, userId)),
    groups,
    notifications,
    unreadCount,
  };
}
