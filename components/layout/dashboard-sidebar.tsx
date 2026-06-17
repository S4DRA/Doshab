"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";

import { PushNotificationToggle } from "@/components/notifications/push-notification-toggle";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { DashboardNotification } from "@/types";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.25" viewBox="0 0 24 24">
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v10h14V10" />
        <path d="M9 20v-6h6v6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/friends",
    label: "Friends",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

type SidebarGroup = {
  firstTextChannelId?: string | null;
  id: string;
  image?: string | null;
  isDirectMessage?: boolean;
  name: string;
};

type SidebarFriend = {
  id: string;
  email: string;
  image?: string | null;
  name: string;
};

type SidebarUser = {
  id: string;
  email: string;
  image?: string | null;
  name: string;
};

type SidebarSnapshot = {
  currentUser: SidebarUser | null;
  friends: SidebarFriend[];
  groups: SidebarGroup[];
  notifications: DashboardNotification[];
  unreadCount: number;
};

type MobileCommandAction = "home" | "friends" | "messages" | "create" | "groups";

const mobileChannelPinCacheKey = "doshab-mobile-channel-pin-v1";
const sidebarCacheKey = "doshab-sidebar-v6";
const notificationSettingsKey = "doshabProfileSettings";
const mobileCommandHoldDelayMs = 260;

type DashboardSidebarProps = {
  initialCurrentUser?: SidebarUser | null;
  initialFriends?: SidebarFriend[];
  initialGroups?: SidebarGroup[];
  initialNotifications?: DashboardNotification[];
  initialUnreadCount?: number;
};

function normalizeSidebarSnapshot(
  snapshot?: Partial<SidebarSnapshot> | null,
): SidebarSnapshot {
  return {
    currentUser: snapshot?.currentUser ?? null,
    friends: snapshot?.friends ?? [],
    groups: snapshot?.groups ?? [],
    notifications: snapshot?.notifications ?? [],
    unreadCount: snapshot?.unreadCount ?? 0,
  };
}

function hasSidebarSnapshotData(snapshot: SidebarSnapshot) {
  return (
    Boolean(snapshot.currentUser) ||
    snapshot.friends.length > 0 ||
    snapshot.groups.length > 0 ||
    snapshot.notifications.length > 0 ||
    snapshot.unreadCount > 0
  );
}

function readStoredSidebarSnapshot(): SidebarSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  const cachedSidebar = window.sessionStorage.getItem(sidebarCacheKey);

  if (!cachedSidebar) {
    return null;
  }

  try {
    return normalizeSidebarSnapshot(JSON.parse(cachedSidebar) as Partial<SidebarSnapshot>);
  } catch {
    window.sessionStorage.removeItem(sidebarCacheKey);
    return null;
  }
}

function writeStoredSidebarSnapshot(snapshot: SidebarSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(sidebarCacheKey, JSON.stringify(snapshot));
}

export function DashboardSidebar({
  initialCurrentUser = null,
  initialFriends = [],
  initialGroups = [],
  initialNotifications = [],
  initialUnreadCount = 0,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [initialServerSnapshot] = useState<SidebarSnapshot>(() =>
    normalizeSidebarSnapshot({
      currentUser: initialCurrentUser,
      friends: initialFriends,
      groups: initialGroups,
      notifications: initialNotifications,
      unreadCount: initialUnreadCount,
    }),
  );
  const [initialSidebarSnapshot] = useState<SidebarSnapshot>(() =>
    hasSidebarSnapshotData(initialServerSnapshot)
      ? initialServerSnapshot
      : readStoredSidebarSnapshot() ?? initialServerSnapshot,
  );
  const [currentUser, setCurrentUser] = useState<SidebarUser | null>(initialSidebarSnapshot.currentUser);
  const [friends, setFriends] = useState<SidebarFriend[]>(initialSidebarSnapshot.friends);
  const [groups, setGroups] = useState<SidebarGroup[]>(initialSidebarSnapshot.groups);
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    initialSidebarSnapshot.notifications,
  );
  const [unreadCount, setUnreadCount] = useState(initialSidebarSnapshot.unreadCount);
  const [toastNotification, setToastNotification] = useState<DashboardNotification | null>(null);
  const [channelsOpen, setChannelsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [friendsQuery, setFriendsQuery] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [groupPickerOpen, setGroupPickerOpen] = useState(false);
  const [activeCommandAction, setActiveCommandAction] = useState<MobileCommandAction | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const commandButtonRef = useRef<HTMLButtonElement | null>(null);
  const activeCommandActionRef = useRef<MobileCommandAction | null>(null);
  const activeCommandPointerIdRef = useRef<number | null>(null);
  const commandOpenedAtRef = useRef(0);
  const commandHoldTimerRef = useRef<number | null>(null);
  const commandHoldCleanupRef = useRef<(() => void) | null>(null);
  const [pinnedGroupId, setPinnedGroupId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(mobileChannelPinCacheKey);
  });
  const seenNotificationIdsRef = useRef(
    new Set(initialSidebarSnapshot.notifications.map((item) => item.id)),
  );
  const toastTimerRef = useRef<number | null>(null);
  const didBootstrapSidebarRef = useRef(false);
  const hasInitialSidebarData = hasSidebarSnapshotData(initialServerSnapshot);
  const deferredFriendsQuery = useDeferredValue(friendsQuery);
  const normalizedFriendsQuery = deferredFriendsQuery.trim().toLowerCase();
  const visibleFriends = normalizedFriendsQuery
    ? friends.filter((friend) => {
        const friendLabel = `${friend.name} ${friend.email}`.toLowerCase();

        return friendLabel.includes(normalizedFriendsQuery);
      })
    : friends;
  const closeFriendsMenu = useCallback(() => {
    setFriendsOpen(false);
    setFriendsQuery("");
  }, []);
  const runMobileCommandAction = useCallback((action: MobileCommandAction) => {
    setActiveCommandAction(null);
    activeCommandPointerIdRef.current = null;
    commandOpenedAtRef.current = 0;

    switch (action) {
      case "home":
        setCommandOpen(false);
        setGroupPickerOpen(false);
        router.push("/dashboard");
        return;
      case "friends":
        setCommandOpen(false);
        setGroupPickerOpen(false);
        router.push("/dashboard/friends");
        return;
      case "messages":
        setCommandOpen(false);
        setGroupPickerOpen(false);
        router.push("/dashboard/messages");
        return;
      case "create":
        setCommandOpen(false);
        setGroupPickerOpen(false);
        router.push("/dashboard#create-space");
        return;
      case "groups":
        setCommandOpen(true);
        setGroupPickerOpen(true);
        return;
    }
  }, [router]);
  const toggleFriendsMenu = useCallback(() => {
    const nextOpen = !friendsOpen;

    setFriendsOpen(nextOpen);

    if (!nextOpen) {
      setFriendsQuery("");
    }
  }, [friendsOpen]);

  const applySidebarSnapshot = useCallback((snapshot: SidebarSnapshot) => {
    setCurrentUser(snapshot.currentUser);
    setFriends(snapshot.friends);
    setGroups(snapshot.groups);
    setNotifications(snapshot.notifications);
    setUnreadCount(snapshot.unreadCount);
    snapshot.notifications.forEach((notification) => {
      seenNotificationIdsRef.current.add(notification.id);
    });
  }, [setCurrentUser, setFriends, setGroups, setNotifications, setUnreadCount]);

  const persistSidebarSnapshot = useCallback((snapshot: SidebarSnapshot) => {
    writeStoredSidebarSnapshot(snapshot);
  }, []);

  const announceNotification = useCallback((notification: DashboardNotification) => {
    const settings = getNotificationSettings();

    if (!notificationAllowedBySettings(notification, settings)) {
      return;
    }

    if (
      document.visibilityState !== "visible" &&
      settings.enableNotifications &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      const browserNotification = new Notification(notification.title, {
        body: settings.showMessagePreview === false && notification.type === "MESSAGE"
          ? "Open VAL to read this message."
          : notification.body,
        data: {
          href: notification.href,
        },
        tag: notification.callId ?? notification.id,
      });

      browserNotification.onclick = () => {
        window.focus();
        window.location.assign(notification.href);
        browserNotification.close();
      };

      return;
    }

    setToastNotification(notification);

    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    toastTimerRef.current = window.setTimeout(() => {
      setToastNotification(null);
      toastTimerRef.current = null;
    }, notification.type === "INCOMING_CALL" ? 9000 : 5200);
  }, [setToastNotification]);

  const refreshSidebar = useCallback(
    async ({ announce }: { announce: boolean }) => {
      const response = await fetch("/api/dashboard/sidebar", {
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      }).catch(() => null);

      if (!response?.ok) {
        return;
      }

      const data = (await response.json().catch(() => null)) as Partial<SidebarSnapshot> | null;

      if (!data) {
        return;
      }

      const nextSnapshot: SidebarSnapshot = {
        currentUser: data.currentUser ?? currentUser,
        friends: data.friends ?? friends,
        groups: data.groups ?? groups,
        notifications: data.notifications ?? notifications,
        unreadCount: data.unreadCount ?? unreadCount,
      };
      const freshNotifications = nextSnapshot.notifications.filter(
        (notification) => !seenNotificationIdsRef.current.has(notification.id),
      );

      applySidebarSnapshot(nextSnapshot);
      persistSidebarSnapshot(nextSnapshot);

      if (!announce) {
        return;
      }

      freshNotifications
        .filter(
          (notification) =>
            !notification.readAt &&
            getNotificationPathname(notification.href) !== pathname,
        )
        .forEach((notification) => announceNotification(notification));
    },
    [
      announceNotification,
      applySidebarSnapshot,
      currentUser,
      friends,
      groups,
      notifications,
      pathname,
      persistSidebarSnapshot,
      unreadCount,
    ],
  );

  useEffect(() => {
    if (didBootstrapSidebarRef.current) {
      return;
    }

    didBootstrapSidebarRef.current = true;

    if (hasInitialSidebarData) {
      persistSidebarSnapshot(initialServerSnapshot);
      return;
    }

    if (hasSidebarSnapshotData(initialSidebarSnapshot)) {
      return;
    }

    const timer = window.setTimeout(() => {
      void refreshSidebar({ announce: false });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [
    hasInitialSidebarData,
    initialServerSnapshot,
    initialSidebarSnapshot,
    persistSidebarSnapshot,
    refreshSidebar,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void refreshSidebar({ announce: false });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [refreshSidebar]);

  useEffect(() => {
    if (!notificationsOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      void refreshSidebar({ announce: false });
    }, 0);

    return () => {
      window.clearTimeout(timer);
    };
  }, [notificationsOpen, refreshSidebar]);

  useEffect(() => {
    const matchingUnreadIds = notifications
      .filter(
        (notification) =>
          !notification.readAt &&
          getNotificationPathname(notification.href) === pathname,
      )
      .map((notification) => notification.id);

    if (!matchingUnreadIds.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      const readAt = new Date().toISOString();
      const nextUnreadCount = Math.max(0, unreadCount - matchingUnreadIds.length);
      const nextNotifications = notifications.map((item) =>
        matchingUnreadIds.includes(item.id)
          ? {
              ...item,
              readAt: item.readAt ?? readAt,
            }
          : item,
      );

      setUnreadCount(nextUnreadCount);
      setNotifications(nextNotifications);
      persistSidebarSnapshot({
        currentUser,
        friends,
        groups,
        notifications: nextNotifications,
        unreadCount: nextUnreadCount,
      });

      void fetch("/api/notifications/read", {
        body: JSON.stringify({ ids: matchingUnreadIds }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }).catch(() => null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [currentUser, friends, groups, notifications, pathname, persistSidebarSnapshot, unreadCount]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }

    if (commandHoldTimerRef.current) {
      window.clearTimeout(commandHoldTimerRef.current);
    }

    commandHoldCleanupRef.current?.();
  }, []);

  useEffect(() => {
    const anyMenuOpen =
      channelsOpen || createOpen || friendsOpen || commandOpen || groupPickerOpen || notificationsOpen || profileOpen;

    if (!anyMenuOpen) {
      return;
    }

    function closeOnOutsidePointer(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node) || sidebarRef.current?.contains(target)) {
        return;
      }

      setChannelsOpen(false);
      setCreateOpen(false);
      closeFriendsMenu();
      setCommandOpen(false);
      setGroupPickerOpen(false);
      setActiveCommandAction(null);
      setNotificationsOpen(false);
      setProfileOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setChannelsOpen(false);
      setCreateOpen(false);
      closeFriendsMenu();
      setCommandOpen(false);
      setGroupPickerOpen(false);
      setActiveCommandAction(null);
      setNotificationsOpen(false);
      setProfileOpen(false);
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [channelsOpen, closeFriendsMenu, commandOpen, createOpen, friendsOpen, groupPickerOpen, notificationsOpen, profileOpen]);

  useEffect(() => {
    activeCommandActionRef.current = activeCommandAction;
  }, [activeCommandAction]);

  useEffect(() => {
    if (!commandOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyTouchAction = document.body.style.touchAction;
    const previousRootOverscrollBehavior = document.documentElement.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";
    document.documentElement.style.overscrollBehavior = "none";

    function getPointerElement(event: PointerEvent) {
      return document.elementFromPoint(event.clientX, event.clientY) ?? event.target;
    }

    function getActionFromTarget(target: EventTarget | null): MobileCommandAction | null {
      if (!(target instanceof Element)) {
        return null;
      }

      const actionTarget = target.closest("[data-command-action]");

      if (!(actionTarget instanceof HTMLElement)) {
        return null;
      }

      const action = actionTarget.dataset.commandAction;

      return action === "home" || action === "friends" || action === "messages" || action === "create" || action === "groups"
        ? action
        : null;
    }

    function isActiveCommandPointer(event: PointerEvent) {
      return activeCommandPointerIdRef.current === null || event.pointerId === activeCommandPointerIdRef.current;
    }

    function highlightPointerAction(event: PointerEvent) {
      if (!isActiveCommandPointer(event)) {
        return;
      }

      event.preventDefault();
      setActiveCommandAction(getActionFromTarget(getPointerElement(event)));
    }

    function cancelCommandHighlight(event: PointerEvent) {
      if (!isActiveCommandPointer(event)) {
        return;
      }

      event.preventDefault();
      setActiveCommandAction(null);
    }

    function closeOnPointerRelease(event: PointerEvent) {
      if (!isActiveCommandPointer(event)) {
        return;
      }

      event.preventDefault();
      activeCommandPointerIdRef.current = null;
      const target = getPointerElement(event);

      if (!(target instanceof Element)) {
        setCommandOpen(false);
        setGroupPickerOpen(false);
        setActiveCommandAction(null);
        return;
      }

      const groupTarget = target.closest("[data-command-group]");
      if (groupTarget instanceof HTMLElement) {
        const groupId = groupTarget.dataset.commandGroup;

        if (groupId) {
          setCommandOpen(false);
          setGroupPickerOpen(false);
          setActiveCommandAction(null);
          router.push(`/dashboard/groups/${groupId}`);
        }

        return;
      }

      const selectedAction = getActionFromTarget(target);

      if (selectedAction) {
        runMobileCommandAction(selectedAction);
        return;
      }

      if (commandButtonRef.current?.contains(target)) {
        setCommandOpen(false);
        setGroupPickerOpen(false);
        setActiveCommandAction(null);
        return;
      }

      setCommandOpen(false);
      setGroupPickerOpen(false);
      setActiveCommandAction(null);
    }

    document.addEventListener("pointermove", highlightPointerAction, { passive: false });
    document.addEventListener("pointerup", closeOnPointerRelease);
    document.addEventListener("pointercancel", cancelCommandHighlight);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.touchAction = previousBodyTouchAction;
      document.documentElement.style.overscrollBehavior = previousRootOverscrollBehavior;
      document.removeEventListener("pointermove", highlightPointerAction);
      document.removeEventListener("pointerup", closeOnPointerRelease);
      document.removeEventListener("pointercancel", cancelCommandHighlight);
    };
  }, [commandOpen, groups, router, runMobileCommandAction]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const dashboardRoutes = [
        "/dashboard",
        "/dashboard/friends",
        "/dashboard/channels",
        "/dashboard/messages",
        "/dashboard/profile",
        "/dashboard/profile/themes",
        ...groups.slice(0, 8).map((group) => getGroupHref(group)),
      ];

      Array.from(new Set(dashboardRoutes)).forEach((href) => {
        router.prefetch(href);
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [groups, router]);

  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  const profileActive = pathname.startsWith("/dashboard/profile");
  const isPrivateChatRoute =
    pathname.startsWith("/dashboard/groups/") &&
    searchParams.get("view") === "messages";
  const messagesActive = pathname.startsWith("/dashboard/messages") || isPrivateChatRoute;
  const pinnedGroup = groups.find((group) => group.id === pinnedGroupId) ?? groups[0] ?? null;
  const closeCommandDock = () => {
    if (commandHoldTimerRef.current) {
      window.clearTimeout(commandHoldTimerRef.current);
      commandHoldTimerRef.current = null;
    }

    commandHoldCleanupRef.current?.();
    commandHoldCleanupRef.current = null;
    setCommandOpen(false);
    setGroupPickerOpen(false);
    setActiveCommandAction(null);
    activeCommandPointerIdRef.current = null;
    commandOpenedAtRef.current = 0;
  };
  const openCommandDock = (pointerId?: number) => {
    if (commandHoldTimerRef.current) {
      window.clearTimeout(commandHoldTimerRef.current);
      commandHoldTimerRef.current = null;
    }

    commandHoldCleanupRef.current?.();
    commandHoldCleanupRef.current = null;
    setCommandOpen(true);
    setActiveCommandAction(null);
    activeCommandPointerIdRef.current = pointerId ?? null;
    commandOpenedAtRef.current = performance.now();
    setChannelsOpen(false);
    setCreateOpen(false);
    closeFriendsMenu();
    setNotificationsOpen(false);
    setProfileOpen(false);
  };
  const cancelCommandHold = () => {
    if (!commandHoldTimerRef.current) {
      return;
    }

    window.clearTimeout(commandHoldTimerRef.current);
    commandHoldTimerRef.current = null;
    commandHoldCleanupRef.current?.();
    commandHoldCleanupRef.current = null;
    activeCommandPointerIdRef.current = null;
  };
  const startCommandHold = (pointerId: number) => {
    cancelCommandHold();
    activeCommandPointerIdRef.current = pointerId;

    const cancelPendingHold = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) {
        return;
      }

      event.preventDefault();
      cancelCommandHold();
    };

    document.addEventListener("pointerup", cancelPendingHold, { passive: false });
    document.addEventListener("pointercancel", cancelPendingHold, { passive: false });
    commandHoldCleanupRef.current = () => {
      document.removeEventListener("pointerup", cancelPendingHold);
      document.removeEventListener("pointercancel", cancelPendingHold);
    };

    commandHoldTimerRef.current = window.setTimeout(() => {
      openCommandDock(pointerId);
    }, mobileCommandHoldDelayMs);
  };
  const toggleCommandDock = () => {
    setCommandOpen((open) => {
      const nextOpen = !open;

      if (!nextOpen) {
        setGroupPickerOpen(false);
        setActiveCommandAction(null);
      }

      return nextOpen;
    });
    setChannelsOpen(false);
    setCreateOpen(false);
    closeFriendsMenu();
    setNotificationsOpen(false);
    setProfileOpen(false);
  };
  const goToGroupMain = (groupId: string) => {
    closeCommandDock();
    router.push(`/dashboard/groups/${groupId}`);
  };

  async function markNotificationsRead() {
    const readAt = new Date().toISOString();
    const nextNotifications = notifications.map((item) => ({
      ...item,
      readAt: item.readAt ?? readAt,
    }));

    setUnreadCount(0);
    setNotifications(nextNotifications);
    persistSidebarSnapshot({
      currentUser,
      friends,
      groups,
      notifications: nextNotifications,
      unreadCount: 0,
    });

    try {
      await fetch("/api/notifications/read", {
        method: "POST",
      });
    } catch {
      // Read state will refresh on the next sidebar fetch.
    }
  }

  async function clearNotifications() {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications([]);
    setUnreadCount(0);
    persistSidebarSnapshot({
      currentUser,
      friends,
      groups,
      notifications: [],
      unreadCount: 0,
    });

    try {
      const response = await fetch("/api/notifications/clear", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not clear notifications.");
      }
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
      persistSidebarSnapshot({
        currentUser,
        friends,
        groups,
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
      });
    }
  }

  const friendsMenu = friendsOpen ? (
    <div
      aria-label="Friends sidebar"
      className="dashboard-sidebar-popover app-surface fixed inset-x-3 bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.5rem)] z-[60] flex max-h-[72dvh] flex-col overflow-hidden rounded-[1.6rem] p-4 sm:bottom-3 sm:left-[calc(var(--dashboard-primary-sidebar-width)+0.75rem)] sm:right-auto sm:top-3 sm:max-h-[calc(100dvh_-_1.5rem)] sm:w-80 sm:rounded-lg min-[1180px]:w-96"
      role="dialog"
    >
      <div className="shrink-0 border-b border-white/10 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="app-section-title px-1">
              Friends
            </p>
            <p className="mt-1 px-1 text-sm leading-5 text-slate-400">
              Search your circle, then jump straight into a message or call.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              aria-label="Add friend"
              className="app-button-primary grid h-10 w-10 shrink-0 place-items-center rounded-lg text-lg font-bold transition"
              href="/dashboard/friends?add=1"
              onClick={() => {
                closeFriendsMenu();
              }}
              title="Add friend"
            >
              +
            </Link>
            <button
              aria-label="Close friends sidebar"
              className="app-icon-button h-10 w-10"
              onClick={closeFriendsMenu}
              title="Close"
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>
        </div>
        <input
          className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:text-sm"
          onChange={(event) => setFriendsQuery(event.target.value)}
          placeholder="Search friends"
          value={friendsQuery}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-3">
        <div className="grid gap-2">
          {visibleFriends.length ? (
            visibleFriends.map((friend) => {
              const friendLabel = friend.name || friend.email;

              return (
                <div
                  className="app-row flex min-w-0 flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center"
                  key={friend.id}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <AvatarInitials imageUrl={friend.image} value={friendLabel} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {friendLabel}
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        {friend.email}
                      </span>
                    </span>
                  </div>
                  <div className="flex w-full gap-2 sm:w-auto sm:items-center">
                    <form
                      action="/api/private-messages"
                      className="min-w-0 flex-1 sm:hidden"
                      method="post"
                      onSubmit={() => {
                        closeFriendsMenu();
                        window.sessionStorage.removeItem(sidebarCacheKey);
                      }}
                    >
                      <input name="friendId" type="hidden" value={friend.id} />
                      <button
                        className="app-button-secondary h-10 w-full rounded-lg px-3 text-sm font-semibold transition"
                        type="submit"
                      >
                        Message
                      </button>
                    </form>
                    <form
                      action="/api/friend-calls/start"
                      className="min-w-0 flex-1 sm:hidden"
                      method="post"
                      onSubmit={() => {
                        closeFriendsMenu();
                      }}
                    >
                      <input name="friendId" type="hidden" value={friend.id} />
                      <button
                        className="app-button-primary h-10 w-full rounded-lg px-3 text-sm font-semibold transition"
                        type="submit"
                      >
                        Call
                      </button>
                    </form>
                    <form
                      action="/api/private-messages"
                      className="hidden sm:block"
                      method="post"
                      onSubmit={() => {
                        closeFriendsMenu();
                        window.sessionStorage.removeItem(sidebarCacheKey);
                      }}
                    >
                      <input name="friendId" type="hidden" value={friend.id} />
                      <button
                        aria-label={`Message ${friendLabel}`}
                        className="app-icon-button h-10 w-10"
                        title={`Message ${friendLabel}`}
                        type="submit"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                        </svg>
                      </button>
                    </form>
                    <form
                      action="/api/friend-calls/start"
                      className="hidden sm:block"
                      method="post"
                      onSubmit={() => {
                        closeFriendsMenu();
                      }}
                    >
                      <input name="friendId" type="hidden" value={friend.id} />
                      <button
                        aria-label={`Call ${friendLabel}`}
                        className="app-icon-button app-icon-button-primary h-10 w-10"
                        title={`Call ${friendLabel}`}
                        type="submit"
                      >
                        <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.05 9.88a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92Z" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              );
            })
          ) : friends.length ? (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-400">
              No friends matched <span className="font-semibold text-slate-200">{friendsQuery.trim()}</span>. Try a name or email instead.
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 px-4 py-5 text-sm leading-6 text-slate-400">
              No friends yet. Add someone to start a message or call.
              <Link
                aria-label="Add friend"
                className="app-button-secondary mt-4 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition"
                href="/dashboard/friends?add=1"
                onClick={() => {
                  closeFriendsMenu();
                }}
              >
                Add friend
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  const createMenu = createOpen ? (
    <div className="dashboard-sidebar-popover app-surface fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] left-3 right-3 z-[60] max-h-[calc(100dvh_-_var(--dashboard-bottom-nav-height)_-_1.5rem)] max-w-sm overflow-y-auto rounded-lg p-3 sm:bottom-auto sm:left-[calc(var(--dashboard-primary-sidebar-width)+0.75rem)] sm:right-auto sm:top-32 sm:w-[calc(100vw-8rem)] sm:max-w-72">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="app-section-title px-1">
            Create
          </p>
          <p className="mt-1 px-1 text-sm leading-5 text-slate-400">
            Start a space, open a private message, or jump to a common action.
          </p>
        </div>
        <button
          aria-label="Close create menu"
          className="app-icon-button h-10 w-10 shrink-0"
          onClick={() => setCreateOpen(false)}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <form
        action="/api/groups"
        className="mt-3 space-y-2"
        method="post"
        onSubmit={() => {
          setCreateOpen(false);
          window.sessionStorage.removeItem(sidebarCacheKey);
        }}
      >
        <input
          className="h-11 w-full rounded-lg border border-white/20 bg-[#050505] px-3 text-base text-white outline-none placeholder:text-slate-500 focus:border-[#FF5F25] sm:h-10 sm:text-sm"
          maxLength={80}
          name="name"
          placeholder="Create a space"
          required
          type="text"
        />
        <button
          className="app-button-primary h-11 w-full rounded-lg text-sm font-bold transition sm:h-10"
          type="submit"
        >
          Create space
        </button>
      </form>

      <div className="my-3 h-px bg-white/20" />

      <p className="app-section-title px-1">
        Friends
      </p>
      <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {friends.length ? (
          friends.slice(0, 5).map((friend) => (
            <div
              className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-white/10"
              key={friend.id}
            >
              <AvatarInitials
                imageUrl={friend.image}
                size="sm"
                value={friend.name || friend.email}
              />
              <form
                action="/api/private-messages"
                className="min-w-0 flex-1"
                method="post"
                onSubmit={() => {
                  window.sessionStorage.removeItem(sidebarCacheKey);
                }}
              >
                <input name="friendId" type="hidden" value={friend.id} />
                <button className="w-full min-w-0 text-left" type="submit">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {friend.name || friend.email}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      Private message
                    </span>
                  </span>
                </button>
              </form>
              <form action="/api/friend-calls/start" method="post">
                <input name="friendId" type="hidden" value={friend.id} />
                <button
                  aria-label={`Call ${friend.name || friend.email}`}
                  className="app-icon-button h-10 w-10 sm:h-8 sm:w-8"
                  title={`Call ${friend.name || friend.email}`}
                  type="submit"
                >
                  <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.05 9.88a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92Z" />
                  </svg>
                </button>
              </form>
            </div>
          ))
        ) : (
          <Link
            className="block rounded-xl px-2 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            href="/dashboard/friends?add=1"
            onClick={() => setCreateOpen(false)}
          >
            Add friends first
          </Link>
        )}
      </div>

      <div className="my-3 h-px bg-white/20" />

      <p className="app-section-title px-1">
        Quick actions
      </p>
      <div className="mt-2 grid gap-2">
        <Link
          className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition"
          href="/dashboard"
          onClick={() => setCreateOpen(false)}
        >
          Open home
        </Link>
        <Link
          className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition"
          href="/dashboard/friends?add=1"
          onClick={() => setCreateOpen(false)}
        >
          Find friends
        </Link>
        <Link
          className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition"
          href="/dashboard/messages"
          onClick={() => setCreateOpen(false)}
        >
          Open messages
        </Link>
        <button
          className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-sm font-semibold transition"
          onClick={() => {
            setCreateOpen(false);
            setNotificationsOpen(true);
          }}
          type="button"
        >
          Open notifications
        </button>
      </div>
    </div>
  ) : null;

  const channelMenu = channelsOpen ? (
    <div className="dashboard-sidebar-popover app-surface fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] left-3 right-3 z-[60] max-h-[calc(100dvh_-_var(--dashboard-bottom-nav-height)_-_1.5rem)] overflow-y-auto rounded-lg p-3 sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="app-section-title">
            Channels
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-400">
            Pick the shortcut shown in the bar.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition"
            href="/dashboard/channels"
            onClick={() => setChannelsOpen(false)}
          >
            All
          </Link>
          <button
            aria-label="Close channels menu"
            className="app-icon-button h-10 w-10"
            onClick={() => setChannelsOpen(false)}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2">
        {groups.length ? (
          groups.map((group) => (
            <Link
              className={`app-row flex items-center gap-3 p-3 ${
                pinnedGroup?.id === group.id ? "border-[#FF5F25]/60 bg-[#FF5F25]/12" : ""
              }`}
              href={`/dashboard/groups/${group.id}`}
              key={group.id}
              onClick={() => {
                setPinnedGroupId(group.id);
                window.localStorage.setItem(mobileChannelPinCacheKey, group.id);
                setChannelsOpen(false);
              }}
            >
              <AvatarInitials fallback="group" imageUrl={group.image} value={group.name} />
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {group.name}
                </span>
                <span className="block truncate text-xs text-slate-400">
                  {pinnedGroup?.id === group.id ? "Pinned shortcut" : "Tap to pin"}
                </span>
              </span>
            </Link>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-sm text-slate-400">
            No channels yet. Create a space first.
          </p>
        )}
      </div>
    </div>
  ) : null;

  const notificationMenu = notificationsOpen ? (
    <div
      aria-label="Notifications"
      className="dashboard-sidebar-popover app-surface fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] left-3 right-3 z-[60] max-h-[calc(100dvh_-_var(--dashboard-bottom-nav-height)_-_1.5rem)] max-w-sm overflow-y-auto rounded-lg p-3 sm:bottom-3 sm:left-[calc(var(--dashboard-primary-sidebar-width)+0.75rem)] sm:right-auto sm:top-auto sm:w-[calc(100vw-8rem)] sm:max-w-96"
      role="dialog"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="app-section-title">
            Notifications
          </p>
          <p className="mt-1 text-sm leading-5 text-slate-400">
            Messages, invites, and calls
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount ? (
            <button
              className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition"
              onClick={markNotificationsRead}
              type="button"
            >
              Mark all read
            </button>
          ) : null}
          {notifications.length ? (
            <button
              className="app-button-secondary inline-flex h-10 items-center rounded-lg px-3 text-xs font-semibold transition"
              onClick={clearNotifications}
              type="button"
            >
              Clear
            </button>
          ) : null}
          <button
            aria-label="Close notifications"
            className="app-icon-button h-10 w-10"
            onClick={() => setNotificationsOpen(false)}
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="mt-3 max-h-[min(27rem,calc(100dvh_-_13rem))] space-y-1 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {notifications.length ? (
          notifications.map((notification) => (
            <Link
              aria-label={`${notification.readAt ? "" : "Unread "}${notification.title}. ${notification.body}`}
              className={`flex min-w-0 gap-3 rounded-lg border px-3 py-2.5 transition hover:border-[#FF5F25]/70 hover:bg-white/10 ${
                notification.readAt
                  ? "border-transparent"
                  : "border-[#FF5F25]/50 bg-[#FF5F25]/10"
              }`}
              href={notification.href}
              key={notification.id}
              onClick={() => {
                setNotificationsOpen(false);
                void markNotificationsRead();
              }}
            >
              <span
                className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border text-[9px] font-black ${
                  notification.type === "INCOMING_CALL"
                    ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-200"
                    : notification.type === "MISSED_CALL"
                      ? "border-red-300/40 bg-red-500/15 text-red-200"
                      : notification.readAt
                        ? "border-white/10 bg-white/7 text-slate-300"
                        : "border-[#FF5F25]/40 bg-[#FF5F25]/15 text-[#FFB199]"
                }`}
              >
                {getNotificationIcon(notification.type)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {notification.title}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-300">
                      {notification.body}
                    </span>
                  </span>
                  {!notification.readAt ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FF5F25]" aria-label="Unread" />
                  ) : null}
                </span>
                <span className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-500">
                    {formatNotificationTime(notification.createdAt)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#FFB199]">
                    {getNotificationActionLabel(notification.type)}
                  </span>
                </span>
              </span>
            </Link>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm leading-6 text-slate-400">
            No notifications yet. Messages, invites, and calls will appear here.
          </p>
        )}
      </div>
      <PushNotificationToggle />
    </div>
  ) : null;

  const profileMenu = profileOpen ? (
    <div className="dashboard-sidebar-popover app-surface fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] right-3 z-[60] max-h-[calc(100dvh_-_var(--dashboard-bottom-nav-height)_-_1.5rem)] w-[calc(100vw-1.5rem)] max-w-72 origin-bottom-right overflow-y-auto rounded-lg p-3 sm:bottom-3 sm:left-[calc(var(--dashboard-primary-sidebar-width)+0.75rem)] sm:right-auto sm:top-auto sm:w-[calc(100vw-8rem)] sm:origin-bottom-left" role="dialog">
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          {currentUser ? (
            <AvatarInitials imageUrl={currentUser.image} value={currentUser.name || currentUser.email} />
          ) : null}
          <div className="min-w-0">
            <p className="app-section-title">Profile</p>
            {currentUser ? (
              <>
                <p className="mt-1 truncate text-sm font-semibold text-white">
                  {currentUser.name || currentUser.email}
                </p>
                <p className="truncate text-xs text-slate-400">{currentUser.email}</p>
              </>
            ) : null}
          </div>
        </div>
        <button
          aria-label="Close profile menu"
          className="app-icon-button h-10 w-10 shrink-0"
          onClick={() => setProfileOpen(false)}
          type="button"
        >
          <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="mt-3 grid gap-2">
        <Link
          className="app-row block min-h-12 rounded-lg px-3 py-3 text-sm font-semibold text-white transition"
          href="/dashboard/profile"
          onClick={() => setProfileOpen(false)}
        >
          Settings
        </Link>
        <form action="/api/auth/logout" method="post">
          <button
            className="app-row min-h-12 w-full rounded-lg px-3 py-3 text-left text-sm font-semibold text-[#FFB199] transition hover:text-white"
            type="submit"
          >
            Log out
          </button>
        </form>
      </div>
    </div>
  ) : null;
  return (
    <>
    <div aria-live="polite" className="sr-only">
      {toastNotification ? `${toastNotification.title}. ${toastNotification.body}` : ""}
    </div>
    {toastNotification ? (
      <div
        className="app-panel fixed inset-x-3 bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] z-[65] flex max-w-md gap-3 border-[#FF5F25]/45 p-3 shadow-2xl shadow-black/40 sm:inset-x-auto sm:bottom-4 sm:right-4 sm:w-96"
        role={toastNotification.type === "INCOMING_CALL" ? "alert" : "status"}
      >
        <Link
          className="flex min-w-0 flex-1 gap-3"
          href={toastNotification.href}
          onClick={() => setToastNotification(null)}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-[#FF5F25]/35 bg-[#FF5F25]/15 text-[10px] font-black text-[#FFB199]">
            {getNotificationIcon(toastNotification.type)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-white">
              {toastNotification.title}
            </span>
            <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-300">
              {toastNotification.body}
            </span>
          </span>
        </Link>
        <button
          aria-label="Dismiss notification"
          className="app-icon-button h-9 w-9 shrink-0"
          onClick={(event) => {
            event.preventDefault();
            setToastNotification(null);
          }}
          title="Dismiss"
          type="button"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
    ) : null}
    <aside className="dashboard-main-sidebar fixed inset-x-0 bottom-0 z-50 flex h-[var(--dashboard-bottom-nav-height)] items-center border-t border-white/10 bg-[#0d100e]/95 px-2 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-12px_48px_-36px_rgba(0,0,0,0.9)] rounded-t-2xl sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:h-auto sm:w-24 sm:flex-col sm:border-r sm:border-t-0 sm:px-3 sm:py-4 sm:shadow-[12px_0_48px_-36px_rgba(0,0,0,0.9)] sm:rounded-t-none min-[1180px]:w-[6.5rem]" data-tour-target="groups-sidebar" ref={sidebarRef}>
      {createMenu}
      {friendsMenu}
      {channelMenu}
      {notificationMenu}
      {profileMenu}
      {commandOpen ? (
        <>
          <div aria-hidden="true" className="val-command-backdrop sm:hidden" />
          <div
            aria-label="VAL quick actions"
            className="val-command-dock sm:hidden"
            role="menu"
          >
            {groupPickerOpen ? (
              <div className="val-command-group-picker" role="menu" aria-label="Joined spaces">
                <p className="val-command-group-title">Spaces</p>
                {groups.length ? (
                  groups.slice(0, 5).map((group) => (
                    <button
                      aria-label={`Open ${group.name}`}
                      className="val-command-group-item"
                      data-command-group={group.id}
                      key={group.id}
                      onClick={() => goToGroupMain(group.id)}
                      type="button"
                    >
                      <AvatarInitials fallback="group" imageUrl={group.image} size="sm" value={group.name} />
                      <span>{group.name}</span>
                    </button>
                  ))
                ) : (
                  <p className="val-command-group-empty">No joined spaces yet.</p>
                )}
              </div>
            ) : null}
            <button
              aria-label="Open home"
              className={`val-command-action val-command-action-home${activeCommandAction === "home" ? " val-command-action-active" : ""}`}
              data-command-action="home"
              onClick={() => {
                runMobileCommandAction("home");
              }}
              role="menuitem"
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="m3 11 9-8 9 8" />
                <path d="M5 10v10h14V10" />
                <path d="M9 20v-6h6v6" />
              </svg>
            </button>
            <button
              aria-label="Open friends"
              className={`val-command-action val-command-action-friends${activeCommandAction === "friends" ? " val-command-action-active" : ""}`}
              data-command-action="friends"
              onClick={() => {
                runMobileCommandAction("friends");
              }}
              role="menuitem"
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </button>
            <button
              aria-label="Open messages"
              className={`val-command-action val-command-action-message${activeCommandAction === "messages" ? " val-command-action-active" : ""}`}
              data-command-action="messages"
              onClick={() => {
                runMobileCommandAction("messages");
              }}
              role="menuitem"
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
              </svg>
            </button>
            <button
              aria-label="Create space"
              className={`val-command-action val-command-action-create${activeCommandAction === "create" ? " val-command-action-active" : ""}`}
              data-command-action="create"
              onClick={() => {
                runMobileCommandAction("create");
              }}
              role="menuitem"
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="M12 5v14" />
                <path d="M5 12h14" />
              </svg>
            </button>
            <button
              aria-label="Show joined spaces"
              className={`val-command-action val-command-action-groups${groupPickerOpen || activeCommandAction === "groups" ? " val-command-action-active" : ""}`}
              data-command-action="groups"
              onClick={() => {
                runMobileCommandAction("groups");
              }}
              role="menuitem"
              type="button"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.25" viewBox="0 0 24 24">
                <path d="M4 6h16" />
                <path d="M4 12h16" />
                <path d="M4 18h16" />
              </svg>
            </button>
          </div>
        </>
      ) : null}
      <div className="flex w-full min-w-0 items-center justify-center sm:hidden" aria-label="VAL mobile command trigger" data-tour-target="mobile-command-button">
        <button
          aria-expanded={commandOpen}
          aria-haspopup="menu"
          aria-label={commandOpen ? "Close quick actions" : "Open quick actions"}
          className={`val-command-button grid place-items-center rounded-full border transition ${
            commandOpen ? "val-command-button-open" : ""
          }`}
          onClick={(event) => {
            event.preventDefault();
          }}
          onContextMenu={(event) => {
            event.preventDefault();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleCommandDock();
              return;
            }

            if (event.key === "Escape") {
              closeCommandDock();
            }
          }}
          onPointerDown={(event) => {
            event.preventDefault();
            if (commandOpen) {
              closeCommandDock();
              return;
            }

            startCommandHold(event.pointerId);
          }}
          onPointerCancel={(event) => {
            event.preventDefault();
            cancelCommandHold();
          }}
          onPointerUp={(event) => {
            event.preventDefault();
            cancelCommandHold();
          }}
          ref={commandButtonRef}
          title="VAL command dock"
          type="button"
        >
          <span className="val-command-button-mark" aria-hidden="true" />
        </button>
      </div>
      <Link
        aria-label="VAL dashboard home"
        className="dashboard-brand-lockup hidden shrink-0 flex-col items-center gap-2 rounded-xl border transition sm:flex"
        href="/dashboard"
      >
        <span className="dashboard-brand-mark" aria-hidden="true" />
        <span className="dashboard-brand-word">VAL</span>
      </Link>
      <nav
        className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-contain px-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex sm:min-h-0 sm:flex-col sm:items-center sm:gap-2 sm:overflow-x-hidden sm:overflow-y-auto sm:px-0 sm:pb-2 sm:pt-3 [&::-webkit-scrollbar]:hidden"
        aria-label="Dashboard"
      >
        {navItems.map((item) => {
          const active =
            item.label === "Messages"
              ? messagesActive
              : pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          if (item.label === "Friends") {
            return (
              <button
                aria-expanded={friendsOpen}
                aria-label="Friends"
                className={`dashboard-nav-icon grid size-11 shrink-0 place-items-center rounded-lg border transition sm:size-12 min-[1180px]:size-[3.25rem] [&_svg]:h-6 [&_svg]:w-6 [&_svg]:min-[1180px]:h-7 [&_svg]:min-[1180px]:w-7 ${
                  active || friendsOpen
                    ? "dashboard-nav-icon-active border-[#FF5F25] text-[#FF5F25]"
                    : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
                }`}
                key={item.href}
                data-tour-target="friends-nav"
                onClick={() => {
                  toggleFriendsMenu();
                  setCreateOpen(false);
                  setNotificationsOpen(false);
                  setProfileOpen(false);
                }}
                title="Friends"
                type="button"
              >
                {item.icon}
              </button>
            );
          }

          return (
            <Link
              aria-label={item.label}
              className={`dashboard-nav-icon grid size-11 shrink-0 place-items-center rounded-lg border transition sm:size-12 min-[1180px]:size-[3.25rem] [&_svg]:h-6 [&_svg]:w-6 [&_svg]:min-[1180px]:h-7 [&_svg]:min-[1180px]:w-7 ${
                active
                  ? "dashboard-nav-icon-active border-[#FF5F25] text-[#FF5F25]"
                  : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
              }`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              key={item.href}
              title={item.label}
            >
              {item.icon}
            </Link>
          );
        })}
        <div className="relative">
          <button
            aria-expanded={createOpen}
            aria-label="Create menu"
            className={`dashboard-nav-icon grid size-11 shrink-0 place-items-center rounded-lg border transition sm:size-12 min-[1180px]:size-[3.25rem] [&_svg]:h-6 [&_svg]:w-6 [&_svg]:min-[1180px]:h-7 [&_svg]:min-[1180px]:w-7 ${
              createOpen
                ? "dashboard-nav-icon-active border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => {
              setCreateOpen((open) => !open);
              closeFriendsMenu();
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            type="button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
        {groups.length ? (
          <div className="mx-1 h-8 w-px shrink-0 bg-white/50 sm:mx-0 sm:my-2 sm:h-px sm:w-8" />
        ) : null}
        {groups.map((group) => {
          const href = getGroupHref(group);
          const groupBaseHref = `/dashboard/groups/${group.id}`;
          const active = pathname === groupBaseHref || pathname.startsWith(`${groupBaseHref}/`);

          return (
            <Link
              aria-label={`${group.name} space`}
              className={`dashboard-nav-icon grid size-11 shrink-0 place-items-center rounded-lg border text-sm font-black transition sm:size-12 min-[1180px]:size-[3.25rem] min-[1180px]:text-base ${
                active
                  ? "dashboard-nav-icon-active border-[#FF5F25] text-[#FF5F25]"
                  : "border-transparent bg-white/7 text-slate-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
              }`}
              href={href}
              aria-current={active ? "page" : undefined}
              key={group.id}
              title={group.name}
            >
              <AvatarInitials fallback="group" imageUrl={group.image} value={group.name} />
            </Link>
          );
        })}
      </nav>

      <div className="hidden shrink-0 items-center gap-1.5 sm:flex sm:flex-col sm:gap-2">
        <div className="relative">
          <button
            aria-expanded={notificationsOpen}
            aria-label="Notifications"
            className={`dashboard-nav-icon relative grid size-11 place-items-center rounded-lg border transition sm:size-12 min-[1180px]:size-[3.25rem] [&_svg]:h-6 [&_svg]:w-6 [&_svg]:min-[1180px]:h-7 [&_svg]:min-[1180px]:w-7 ${
              notificationsOpen
                ? "dashboard-nav-icon-active border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            }`}
            data-tour-target="notifications-nav"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setCreateOpen(false);
              closeFriendsMenu();
              setProfileOpen(false);
            }}
            type="button"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount ? (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-[#FF5F25] px-1 text-[10px] font-black leading-5 text-black">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
        </div>

        <div className="relative">
          <button
            aria-expanded={profileOpen}
            aria-label="Profile menu"
            className={`dashboard-nav-icon grid size-11 place-items-center rounded-lg border transition sm:size-12 min-[1180px]:size-[3.25rem] [&_svg]:h-6 [&_svg]:w-6 [&_svg]:min-[1180px]:h-7 [&_svg]:min-[1180px]:w-7 ${
              profileActive || profileOpen
                ? "dashboard-nav-icon-active border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => {
              setProfileOpen((open) => !open);
              setCreateOpen(false);
              closeFriendsMenu();
              setNotificationsOpen(false);
            }}
            type="button"
          >
            {currentUser ? (
              <AvatarInitials
                imageUrl={currentUser.image}
                value={currentUser.name || currentUser.email}
              />
            ) : (
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </aside>
    </>
  );
}

function formatNotificationTime(value: Date | string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  return `${Math.floor(diffHours / 24)}d ago`;
}

type LocalNotificationSettings = {
  callNotifications?: boolean;
  enableNotifications?: boolean;
  friendInviteNotifications?: boolean;
  messageNotifications?: boolean;
  showMessagePreview?: boolean;
  soundEnabled?: boolean;
};

function getNotificationSettings(): LocalNotificationSettings {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(notificationSettingsKey);

    return stored ? (JSON.parse(stored) as LocalNotificationSettings) : {};
  } catch {
    return {};
  }
}

function notificationAllowedBySettings(
  notification: DashboardNotification,
  settings: LocalNotificationSettings,
) {
  switch (notification.type) {
    case "INCOMING_CALL":
    case "MISSED_CALL":
      return settings.callNotifications !== false;
    case "FRIEND_REQUEST":
    case "GROUP_INVITE":
      return settings.friendInviteNotifications !== false;
    case "MESSAGE":
      return settings.messageNotifications !== false;
    default:
      return true;
  }
}

function getNotificationIcon(type: DashboardNotification["type"]) {
  switch (type) {
    case "FRIEND_REQUEST":
      return "FR";
    case "GROUP_INVITE":
      return "IN";
    case "INCOMING_CALL":
      return "CALL";
    case "MISSED_CALL":
      return "MISS";
    case "SYSTEM":
      return "SYS";
    default:
      return "MSG";
  }
}

function getGroupHref(group: SidebarGroup) {
  return group.firstTextChannelId
    ? `/dashboard/groups/${group.id}/channels/${group.firstTextChannelId}`
    : `/dashboard/groups/${group.id}`;
}

function getNotificationPathname(href: string) {
  return href.split(/[?#]/, 1)[0] || href;
}

function getNotificationActionLabel(type: DashboardNotification["type"]) {
  switch (type) {
    case "FRIEND_REQUEST":
      return "Review";
    case "GROUP_INVITE":
      return "Open invites";
    case "INCOMING_CALL":
      return "Answer";
    case "MISSED_CALL":
      return "Details";
    default:
      return "Open";
  }
}
