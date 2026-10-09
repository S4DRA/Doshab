import { Big_Shoulders } from "next/font/google";
import "./val-design.css";
import "./mobile.css";
import "./settings-media.css";
import { MobileNavigationProvider, MobileShell } from "@/components/mobile/mobile-shell";
import { MobileNavbarPreferencesProvider } from "@/components/mobile/mobile-navbar-preferences";
import { MessageDraftsProvider } from "@/components/chat/message-drafts-provider";
import { SidebarArtworkPreferences } from "@/components/profile/sidebar-artwork-preferences";
import { ThemePreferences } from "@/components/theme/theme-preferences";
import { DashboardSidebar } from "@/components/layout/dashboard-sidebar";
import { DashboardHashAnchorScroller } from "@/components/layout/dashboard-hash-anchor-scroller";
import { DashboardOnboardingCoordinator } from "@/components/onboarding/dashboard-onboarding-coordinator";
import { IncomingCallWatcher } from "@/components/calls/incoming-call-watcher";
import { PersistentCallProvider } from "@/components/calls/persistent-call-provider";
import { ValViewport } from "@/components/layout/val-viewport";
import { DashboardPeopleProvider } from "@/components/layout/dashboard-people-provider";
import { PeopleRail } from "@/components/layout/people-rail";
import { getDashboardSidebarGroups } from "@/lib/dashboard-data";
import { friendFromPair } from "@/lib/friends";
import { getAuthState } from "@/lib/auth";
import { dashboardNotificationSelect } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const editorial = Big_Shoulders({
  variable: "--font-val-display",
  subsets: ["latin", "latin-ext"],
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
      <ThemePreferences />
      <DashboardPeopleProvider currentUserId={auth.user.id} initialFriends={sidebarData.friends}>
        <SidebarArtworkPreferences />
        <MessageDraftsProvider key={auth.user.id}>
          <MobileNavigationProvider>
            <MobileNavbarPreferencesProvider key={auth.user.id} userId={auth.user.id}>
            <DashboardSidebar
              initialCurrentUser={sidebarData.currentUser}
              initialFriends={sidebarData.friends}
              initialGroups={sidebarData.groups}
              initialNotifications={sidebarData.notifications}
              initialUnreadCount={sidebarData.unreadCount}
            />
            <PersistentCallProvider>
              <MobileShell image={auth.user.image} name={auth.user.name} />
              <div className="dashboard-content-frame dashboard-density min-h-0 w-full min-w-0 overflow-hidden">
                <div className="val-route-content">{children}</div>
                <PeopleRail />
              </div>
              <DashboardHashAnchorScroller />
              <DashboardOnboardingCoordinator />
              <IncomingCallWatcher />
            </PersistentCallProvider>
            </MobileNavbarPreferencesProvider>
          </MobileNavigationProvider>
        </MessageDraftsProvider>
      </DashboardPeopleProvider>
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
