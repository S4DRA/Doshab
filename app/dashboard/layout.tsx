import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardOnboardingCoordinator } from "@/components/onboarding/dashboard-onboarding-coordinator";
import { IncomingCallWatcher } from "@/components/calls/incoming-call-watcher";
import { PersistentCallProvider } from "@/components/calls/persistent-call-provider";
import { getDashboardSidebarGroups } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { getAuthState } from "@/lib/auth";
import { dashboardNotificationSelect } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthState({ includeImage: true });

  if (auth.status === "unverified") {
    redirect("/verify-email");
  }

  if (auth.status !== "authenticated") {
    const headerList = await headers();
    const returnTo = getSafeDashboardReturnTo(headerList.get("x-doshab-path"));

    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const sidebarData = await getInitialSidebarData(auth.user.id);

  return (
    <>
      <DashboardSidebar
        initialCurrentUser={sidebarData?.currentUser}
        initialFriends={sidebarData?.friends}
        initialGroups={sidebarData?.groups}
        initialNotifications={sidebarData?.notifications}
        initialUnreadCount={sidebarData?.unreadCount}
      />
      <PersistentCallProvider>
        <div className="dashboard-content-frame dashboard-density min-h-0 w-full min-w-0 overflow-hidden">{children}</div>
        <DashboardOnboardingCoordinator />
        <IncomingCallWatcher />
      </PersistentCallProvider>
    </>
  );
}

function getSafeDashboardReturnTo(path: string | null) {
  return path && isDashboardPath(path) ? path : "/dashboard";
}

function isDashboardPath(path: string) {
  return path === "/dashboard" || path.startsWith("/dashboard/") || path.startsWith("/dashboard?");
}

async function getInitialSidebarData(userId: string) {
  const [currentUser, groups, friendships, notifications, unreadCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
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
      select: dashboardNotificationSelect,
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
