import { Big_Shoulders } from "next/font/google";
import "./val-design.css";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHashAnchorScroller } from "@/components/layout/dashboard-hash-anchor-scroller";
import { DashboardOnboardingCoordinator } from "@/components/onboarding/dashboard-onboarding-coordinator";
import { IncomingCallWatcher } from "@/components/calls/incoming-call-watcher";
import { PersistentCallProvider } from "@/components/calls/persistent-call-provider";
import { ValViewport } from "@/components/layout/val-viewport";
import { getDashboardSidebarGroups } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { getAuthState } from "@/lib/auth";
import { dashboardNotificationSelect } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const editorial = Big_Shoulders({
  variable: "--font-val-display",
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "Arial", "sans-serif"],
});

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = await getAuthState({ includeImage: true });

  if (auth.status !== "authenticated") {
    const headerList = await headers();
    const returnTo = getSafeDashboardReturnTo(headerList.get("x-doshab-path"));

    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  const sidebarData = await getInitialSidebarData(auth.user.id);

  return (
    <div id="val-app" className={`val-app ${editorial.variable}`}>
      <ValViewport />
      <DashboardSidebar
        initialCurrentUser={sidebarData?.currentUser}
        initialFriends={sidebarData?.friends}
        initialGroups={sidebarData?.groups}
        initialNotifications={sidebarData?.notifications}
        initialUnreadCount={sidebarData?.unreadCount}
      />
      <PersistentCallProvider>
        <div className="dashboard-content-frame dashboard-density min-h-0 w-full min-w-0 overflow-hidden">
          <div className="val-route-content">{children}</div>
          <aside className="val-world-rail" aria-hidden="true">
            <div className="val-hazard" />
            <p>Spaces // Human connections</p>
            <div className="val-world-image" />
            <ol><li>Conversation</li><li>Collaboration</li><li>Communities</li><li>Beyond</li></ol>
            <p className="val-world-motto">A more<br />human internet<span /></p>
          </aside>
        </div>
        <DashboardHashAnchorScroller />
        <DashboardOnboardingCoordinator />
        <IncomingCallWatcher />
      </PersistentCallProvider>
    </div>
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
