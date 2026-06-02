import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { IncomingCallWatcher } from "@/components/calls/incoming-call-watcher";
import { PersistentCallProvider } from "@/components/calls/persistent-call-provider";
import { getDashboardSidebarGroups } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { getAuthState } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AgentAmirTheme } from "@/components/theme/presets/agent-amir/agent-amir-theme";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthState();

  if (auth.status === "unverified") {
    redirect("/verify-email");
  }

  if (auth.status !== "authenticated") {
    redirect("/login");
  }

  const sidebarData = await getInitialSidebarData(auth.user.id);
  const isAmirPreset = sidebarData.currentUser?.name?.trim().toLowerCase() === "amir";

  return (
    <AgentAmirThemeWrapper enabled={isAmirPreset}>
      <DashboardSidebar
        initialCurrentUser={sidebarData?.currentUser}
        initialFriends={sidebarData?.friends}
        initialGroups={sidebarData?.groups}
        initialNotifications={sidebarData?.notifications}
        initialUnreadCount={sidebarData?.unreadCount}
      />
      <PersistentCallProvider>
        <div className="dashboard-content-frame min-w-0 overflow-hidden sm:pl-16">{children}</div>
        <IncomingCallWatcher />
      </PersistentCallProvider>
    </AgentAmirThemeWrapper>
  );
}

function AgentAmirThemeWrapper({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  if (!enabled) {
    return children;
  }

  return <AgentAmirTheme>{children}</AgentAmirTheme>;
}

async function getInitialSidebarData(userId: string) {
  const [currentUser, groups, friendships, notifications, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
      },
    }),
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
            status: true,
          },
        },
        userTwo: {
          select: {
            id: true,
            name: true,
            email: true,
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
    currentUser,
    friends: friendships.map((friendship) => friendFromPair(friendship, userId)),
    groups,
    notifications,
    unreadCount,
  };
}
