"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { PushNotificationToggle } from "@/components/notifications/push-notification-toggle";
import { AvatarInitials } from "@/components/ui/avatar-initials";
import { LogoMark } from "@/components/ui/logo-mark";
import type { DashboardNotification } from "@/types";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M3 12 12 3l9 9" />
        <path d="M9 21v-9h6v9" />
      </svg>
    ),
  },
  {
    href: "/dashboard/friends",
    label: "Friends",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

type SidebarGroup = {
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

const mobileChannelPinCacheKey = "doshab-mobile-channel-pin-v1";
const sidebarCacheKey = "doshab-sidebar-v6";
const notificationSettingsKey = "doshabProfileSettings";
const notificationPollIntervalMs = 15000;

type DashboardSidebarProps = {
  initialCurrentUser?: SidebarUser | null;
  initialFriends?: SidebarFriend[];
  initialGroups?: SidebarGroup[];
  initialNotifications?: DashboardNotification[];
  initialUnreadCount?: number;
};

export function DashboardSidebar({
  initialCurrentUser = null,
  initialFriends = [],
  initialGroups = [],
  initialNotifications = [],
  initialUnreadCount = 0,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<SidebarUser | null>(initialCurrentUser);
  const [friends, setFriends] = useState<SidebarFriend[]>(initialFriends);
  const [groups, setGroups] = useState<SidebarGroup[]>(initialGroups);
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    initialNotifications,
  );
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [toastNotification, setToastNotification] = useState<DashboardNotification | null>(null);
  const [channelsOpen, setChannelsOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [pinnedGroupId, setPinnedGroupId] = useState<string | null>(() => {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(mobileChannelPinCacheKey);
  });
  const seenNotificationIdsRef = useRef(new Set(initialNotifications.map((item) => item.id)));
  const toastTimerRef = useRef<number | null>(null);

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
          ? "Open Doshab to read this message."
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
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadGroups() {
      const cachedSidebar = window.sessionStorage.getItem(sidebarCacheKey);

      if (cachedSidebar) {
        try {
          const parsedSidebar = JSON.parse(cachedSidebar) as {
            currentUser?: SidebarUser | null;
            friends?: SidebarFriend[];
            groups?: SidebarGroup[];
            notifications?: DashboardNotification[];
            unreadCount?: number;
          };

          if (isMounted) {
            setCurrentUser(parsedSidebar.currentUser ?? initialCurrentUser);
            setFriends(parsedSidebar.friends ?? []);
            setGroups(parsedSidebar.groups?.length ? parsedSidebar.groups : initialGroups);
            setNotifications(parsedSidebar.notifications ?? []);
            setUnreadCount(parsedSidebar.unreadCount ?? 0);
          }
        } catch {
          window.sessionStorage.removeItem(sidebarCacheKey);
        }
      }

      try {
        const response = await fetch("/api/dashboard/sidebar", {
          headers: {
            accept: "application/json",
          },
        });

        if (!response.ok) {
          return;
        }

        const data = (await response.json()) as {
          currentUser?: SidebarUser | null;
          friends?: SidebarFriend[];
          groups?: SidebarGroup[];
          notifications?: DashboardNotification[];
          unreadCount?: number;
        };

        if (isMounted) {
          const nextCurrentUser = data.currentUser ?? initialCurrentUser;
          const nextFriends = data.friends ?? [];
          const nextGroups = data.groups ?? [];
          const nextNotifications = data.notifications ?? [];
          const nextUnreadCount = data.unreadCount ?? 0;
          setCurrentUser(nextCurrentUser);
          setFriends(nextFriends);
          setGroups(nextGroups);
          setNotifications(nextNotifications);
          setUnreadCount(nextUnreadCount);
          window.sessionStorage.setItem(
            sidebarCacheKey,
            JSON.stringify({
              currentUser: nextCurrentUser,
              friends: nextFriends,
              groups: nextGroups,
              notifications: nextNotifications,
              unreadCount: nextUnreadCount,
            }),
          );
        }
      } catch {
        // Sidebar shortcuts are progressive enhancement; page navigation still works.
      }
    }

    void loadGroups();
    const refreshIntervalMs = 120000;
    const refreshTimer = window.setInterval(() => {
      if (document.visibilityState !== "visible") {
        return;
      }

      void loadGroups();
    }, refreshIntervalMs);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [initialCurrentUser, initialGroups]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications({ announce }: { announce: boolean }) {
      const response = await fetch("/api/notifications", {
        cache: "no-store",
        headers: {
          accept: "application/json",
        },
      }).catch(() => null);

      if (!response?.ok || cancelled) {
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        notifications?: DashboardNotification[];
        unreadCount?: number;
      } | null;
      const nextNotifications = data?.notifications ?? [];
      const nextUnreadCount = data?.unreadCount ?? 0;
      const freshNotifications = nextNotifications.filter(
        (notification) => !seenNotificationIdsRef.current.has(notification.id),
      );

      freshNotifications.forEach((notification) => {
        seenNotificationIdsRef.current.add(notification.id);
      });

      setNotifications(nextNotifications);
      setUnreadCount(nextUnreadCount);
      window.sessionStorage.removeItem(sidebarCacheKey);

      if (!announce) {
        return;
      }

      freshNotifications
        .filter((notification) => !notification.readAt && notification.href !== pathname)
        .forEach((notification) => announceNotification(notification));
    }

    void loadNotifications({ announce: false });

    const timer = window.setInterval(() => {
      void loadNotifications({ announce: true });
    }, notificationPollIntervalMs);

    const handleVisibilityChange = () => {
      void loadNotifications({ announce: false });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [announceNotification, pathname]);

  useEffect(() => {
    const matchingUnreadIds = notifications
      .filter((notification) => !notification.readAt && notification.href === pathname)
      .map((notification) => notification.id);

    if (!matchingUnreadIds.length) {
      return;
    }

    const timer = window.setTimeout(() => {
      setUnreadCount((count) => Math.max(0, count - matchingUnreadIds.length));
      setNotifications((items) =>
        items.map((item) =>
          matchingUnreadIds.includes(item.id)
            ? {
                ...item,
                readAt: item.readAt ?? new Date().toISOString(),
              }
            : item,
        ),
      );

      void fetch("/api/notifications/read", {
        body: JSON.stringify({ ids: matchingUnreadIds }),
        headers: {
          "content-type": "application/json",
        },
        method: "POST",
      }).catch(() => null);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [notifications, pathname]);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      window.clearTimeout(toastTimerRef.current);
    }
  }, []);

  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  const profileActive = pathname.startsWith("/dashboard/profile");
  const pinnedGroup = groups.find((group) => group.id === pinnedGroupId) ?? groups[0] ?? null;
  const pinnedGroupHref = pinnedGroup ? `/dashboard/groups/${pinnedGroup.id}` : "/dashboard/channels";

  async function markNotificationsRead() {
    setUnreadCount(0);
    setNotifications((items) =>
      items.map((item) => ({
        ...item,
        readAt: item.readAt ?? new Date().toISOString(),
      })),
    );

    try {
      await fetch("/api/notifications/read", {
        method: "POST",
      });
      window.sessionStorage.removeItem(sidebarCacheKey);
    } catch {
      // Read state will refresh on the next sidebar fetch.
    }
  }

  async function clearNotifications() {
    const previousNotifications = notifications;
    const previousUnreadCount = unreadCount;

    setNotifications([]);
    setUnreadCount(0);

    try {
      const response = await fetch("/api/notifications/clear", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Could not clear notifications.");
      }

      window.sessionStorage.removeItem(sidebarCacheKey);
    } catch {
      setNotifications(previousNotifications);
      setUnreadCount(previousUnreadCount);
    }
  }

  const friendsMenu = friendsOpen ? (
    <div className="app-surface fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] left-3 right-3 z-50 max-h-[calc(100dvh_-_var(--dashboard-bottom-nav-height)_-_1.5rem)] max-w-sm overflow-y-auto rounded-lg p-3 sm:absolute sm:bottom-auto sm:left-14 sm:right-auto sm:top-24 sm:w-[calc(100vw-4.25rem)] sm:max-w-80">
      <div className="flex items-center justify-between gap-3">
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          Friends
        </p>
        <Link
          aria-label="Add friend"
          className="app-button-primary grid h-9 w-9 shrink-0 place-items-center rounded-lg text-lg font-bold transition"
          href="/dashboard/friends?add=1"
          onClick={() => setFriendsOpen(false)}
          prefetch={false}
          title="Add friend"
        >
          +
        </Link>
      </div>
      <div className="mt-3 grid gap-1.5">
        {friends.length ? (
          friends.map((friend) => {
            const friendLabel = friend.name || friend.email;

            return (
              <div
                className="flex min-w-0 items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-white/10"
                key={friend.id}
              >
                <AvatarInitials imageUrl={friend.image} size="sm" value={friendLabel} />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">
                  {friendLabel}
                </span>
                <form
                  action="/api/private-messages"
                  method="post"
                  onSubmit={() => {
                    setFriendsOpen(false);
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
                  method="post"
                  onSubmit={() => setFriendsOpen(false)}
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
            );
          })
        ) : (
          <Link
            className="block rounded-lg border border-dashed border-white/15 px-3 py-4 text-sm font-semibold text-slate-300 transition hover:border-[#FF5F25]/50 hover:text-white"
            href="/dashboard/friends?add=1"
            onClick={() => setFriendsOpen(false)}
            prefetch={false}
          >
            +
          </Link>
        )}
      </div>
    </div>
  ) : null;

  const createMenu = createOpen ? (
    <div className="app-surface fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] left-3 right-3 z-50 max-h-[calc(100dvh_-_var(--dashboard-bottom-nav-height)_-_1.5rem)] max-w-sm overflow-y-auto rounded-lg p-3 sm:absolute sm:bottom-auto sm:left-14 sm:right-auto sm:top-32 sm:w-[calc(100vw-4.25rem)] sm:max-w-72">
      <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
        Create
      </p>
      <form
        action="/api/groups"
        className="mt-3 space-y-2"
        method="post"
        onSubmit={() => {
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

      <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
        Friends
      </p>
      <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {friends.length ? (
          friends.map((friend) => (
            <div
              className="flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-white/10"
              key={friend.id}
            >
              <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/20 bg-[#050505] text-xs font-black text-white">
                {getInitials(friend.name || friend.email)}
              </span>
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
            href="/dashboard/friends"
            onClick={() => setCreateOpen(false)}
            prefetch={false}
          >
            Add friends first
          </Link>
        )}
      </div>
    </div>
  ) : null;

  const channelMenu = channelsOpen ? (
    <div className="app-surface fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] left-3 right-3 z-50 max-h-[calc(100dvh_-_var(--dashboard-bottom-nav-height)_-_1.5rem)] overflow-y-auto rounded-lg p-3 sm:hidden">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Channels
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Pick the shortcut shown in the bar.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 items-center rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200"
          href="/dashboard/channels"
          onClick={() => setChannelsOpen(false)}
          prefetch={false}
        >
          All
        </Link>
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
              prefetch={false}
            >
              <AvatarInitials imageUrl={group.image} value={group.name} />
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
      className="app-surface fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] left-3 right-3 z-50 max-h-[calc(100dvh_-_var(--dashboard-bottom-nav-height)_-_1.5rem)] max-w-sm overflow-y-auto rounded-lg p-3 sm:absolute sm:bottom-0 sm:left-14 sm:right-auto sm:top-auto sm:w-[calc(100vw-4.25rem)] sm:max-w-96"
      role="dialog"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Notifications
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Messages, invites, and calls
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount ? (
            <button
              className="min-h-9 rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-[#FF5F25] hover:text-[#FF5F25]"
              onClick={markNotificationsRead}
              type="button"
            >
              Mark read
            </button>
          ) : null}
          {notifications.length ? (
            <button
              className="min-h-9 rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white transition hover:border-[#FF5F25] hover:text-[#FF5F25]"
              onClick={clearNotifications}
              type="button"
            >
              Clear
            </button>
          ) : null}
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
              prefetch={false}
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
    <div className="app-surface fixed bottom-[calc(var(--dashboard-bottom-nav-height)_+_0.75rem)] right-3 z-50 w-[calc(100vw-1.5rem)] max-w-44 rounded-lg p-2 sm:absolute sm:bottom-0 sm:left-14 sm:right-auto sm:top-auto sm:w-[calc(100vw-4.25rem)]">
      <Link
        className="block min-h-10 rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        href="/dashboard/profile"
        onClick={() => setProfileOpen(false)}
        prefetch={false}
      >
        Settings
      </Link>
      <form action="/api/auth/logout" method="post">
        <button
          className="mt-1 min-h-10 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#FF5F25] transition hover:bg-[#FF5F25] hover:text-black"
          type="submit"
        >
          Log out
        </button>
      </form>
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
          prefetch={false}
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
    <aside className="fixed inset-x-0 bottom-0 z-50 flex h-[var(--dashboard-bottom-nav-height)] items-center border-t border-white/10 bg-[#090c0a]/95 px-2 pb-[env(safe-area-inset-bottom)] text-white shadow-[0_-12px_48px_-36px_rgba(0,0,0,0.9)] backdrop-blur sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:h-auto sm:w-16 sm:flex-col sm:border-r sm:border-t-0 sm:px-2 sm:py-3 sm:shadow-[12px_0_48px_-36px_rgba(0,0,0,0.9)] min-[1180px]:w-[4.75rem]">
      {createMenu}
      {friendsMenu}
      {channelMenu}
      {notificationMenu}
      {profileMenu}
      <nav className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-0.5 sm:hidden" aria-label="Mobile dashboard">
        <div className="flex min-w-0 items-center justify-start gap-0.5">
          <button
            aria-label="Friends"
            className={`grid size-10 place-items-center rounded-lg border transition min-[390px]:size-11 ${
              pathname.startsWith("/dashboard/friends") || friendsOpen
                ? "border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300"
            }`}
            aria-expanded={friendsOpen}
            onClick={() => {
              setFriendsOpen((open) => !open);
              setChannelsOpen(false);
              setCreateOpen(false);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            title="Friends"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </button>
          <button
            aria-expanded={createOpen}
            aria-label="Create menu"
            className={`grid size-10 place-items-center rounded-lg border transition min-[390px]:size-11 ${
              createOpen ? "border-[#FF5F25] text-[#FF5F25]" : "border-transparent text-slate-300"
            }`}
            onClick={() => {
              setCreateOpen((open) => !open);
              setChannelsOpen(false);
              setFriendsOpen(false);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            title="Create"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
          <div className="flex items-center rounded-lg border border-transparent">
            <Link
              aria-label={pinnedGroup ? `${pinnedGroup.name} channel shortcut` : "Channels"}
              className={`grid size-10 place-items-center rounded-lg transition min-[390px]:size-11 ${
                pathname.startsWith("/dashboard/groups") || pathname.startsWith("/dashboard/channels")
                  ? "text-[#FF5F25]"
                  : "text-slate-300"
              }`}
              href={pinnedGroupHref}
              aria-current={
                pathname.startsWith("/dashboard/groups") || pathname.startsWith("/dashboard/channels")
                  ? "page"
                  : undefined
              }
              prefetch={false}
              title={pinnedGroup ? `${pinnedGroup.name} channels` : "Channels"}
            >
              {pinnedGroup ? (
                <AvatarInitials imageUrl={pinnedGroup.image} size="sm" value={pinnedGroup.name} />
              ) : (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </svg>
              )}
            </Link>
            <button
              aria-expanded={channelsOpen}
              aria-label="Choose channel shortcut"
              className={`grid h-10 w-6 place-items-center rounded-lg transition min-[390px]:h-11 ${
                channelsOpen ? "text-[#FF5F25]" : "text-slate-400"
              }`}
              onClick={() => {
              setChannelsOpen((open) => !open);
              setCreateOpen(false);
              setFriendsOpen(false);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
              title="Choose channel shortcut"
              type="button"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>

        <Link
          aria-label="Home"
          className={`grid size-11 place-items-center rounded-lg border transition min-[390px]:size-12 ${
            pathname === "/dashboard"
              ? "border-[#FF5F25] text-[#FF5F25]"
              : "border-transparent text-slate-300"
          }`}
          href="/dashboard"
          aria-current={pathname === "/dashboard" ? "page" : undefined}
          prefetch={false}
          title="Home"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 12 12 3l9 9" />
            <path d="M9 21v-9h6v9" />
          </svg>
        </Link>

        <div className="flex min-w-0 items-center justify-end gap-0.5">
          <button
            aria-expanded={notificationsOpen}
            aria-label="Notifications"
            className={`relative grid size-10 place-items-center rounded-lg border transition min-[390px]:size-11 ${
              notificationsOpen ? "border-[#FF5F25] text-[#FF5F25]" : "border-transparent text-slate-300"
            }`}
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setChannelsOpen(false);
              setCreateOpen(false);
              setFriendsOpen(false);
              setProfileOpen(false);
            }}
            title="Notifications"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount ? (
              <span className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-[#FF5F25] px-1 text-[10px] font-black leading-5 text-black">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
          <button
            aria-expanded={profileOpen}
            aria-label="Profile menu"
            className={`grid size-10 place-items-center rounded-lg border transition min-[390px]:size-11 ${
              profileActive || profileOpen ? "border-[#FF5F25] text-[#FF5F25]" : "border-transparent text-slate-300"
            }`}
            onClick={() => {
              setProfileOpen((open) => !open);
              setChannelsOpen(false);
              setCreateOpen(false);
              setFriendsOpen(false);
              setNotificationsOpen(false);
            }}
            title="Profile menu"
            type="button"
          >
            {currentUser ? (
              <AvatarInitials
                imageUrl={currentUser.image}
                value={currentUser.name || currentUser.email}
              />
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            )}
          </button>
        </div>
      </nav>
      <Link
        aria-label="Dashboard"
        className="hidden size-12 place-items-center transition sm:grid sm:size-14 min-[1180px]:size-16"
        href="/dashboard"
        prefetch={false}
      >
        <LogoMark className="h-12 w-12 sm:h-14 sm:w-14 min-[1180px]:h-16 min-[1180px]:w-16" />
      </Link>

      <nav
        className="hidden min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-contain px-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-4 sm:flex sm:min-h-0 sm:flex-col sm:items-center sm:gap-2 sm:overflow-x-hidden sm:overflow-y-auto sm:px-0 sm:pb-2 [&::-webkit-scrollbar]:hidden"
        aria-label="Dashboard"
      >
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          if (item.label === "Friends") {
            return (
              <button
                aria-expanded={friendsOpen}
                aria-label="Friends"
                className={`grid size-10 shrink-0 place-items-center rounded-lg border transition sm:size-11 min-[1180px]:size-12 [&_svg]:min-[1180px]:h-6 [&_svg]:min-[1180px]:w-6 ${
                  active || friendsOpen
                    ? "border-[#FF5F25] text-[#FF5F25]"
                    : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
                }`}
                key={item.href}
                onClick={() => {
                  setFriendsOpen((open) => !open);
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
              className={`grid size-10 shrink-0 place-items-center rounded-lg border transition sm:size-11 min-[1180px]:size-12 [&_svg]:min-[1180px]:h-6 [&_svg]:min-[1180px]:w-6 ${
                active
                  ? "border-[#FF5F25] text-[#FF5F25]"
                  : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
              }`}
              href={item.href}
              aria-current={active ? "page" : undefined}
              key={item.href}
              prefetch={false}
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
            className={`grid size-10 shrink-0 place-items-center rounded-lg border transition sm:size-11 min-[1180px]:size-12 [&_svg]:min-[1180px]:h-6 [&_svg]:min-[1180px]:w-6 ${
              createOpen
                ? "border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => {
              setCreateOpen((open) => !open);
              setFriendsOpen(false);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 5v14" />
              <path d="M5 12h14" />
            </svg>
          </button>
        </div>
        {groups.length ? (
          <div className="mx-1 h-8 w-px shrink-0 bg-white/50 sm:mx-0 sm:my-2 sm:h-px sm:w-8" />
        ) : null}
        {groups.map((group) => {
          const href = `/dashboard/groups/${group.id}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              aria-label={`${group.name} space`}
              className={`grid size-10 shrink-0 place-items-center rounded-lg border text-sm font-black transition sm:size-11 min-[1180px]:size-12 min-[1180px]:text-base ${
                active
                  ? "border-[#FF5F25] text-[#FF5F25]"
                  : "border-transparent bg-white/7 text-slate-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
              }`}
              href={href}
              aria-current={active ? "page" : undefined}
              key={group.id}
              prefetch={false}
              title={group.name}
            >
              <AvatarInitials imageUrl={group.image} value={group.name} />
            </Link>
          );
        })}
      </nav>

      <div className="hidden shrink-0 items-center gap-1.5 sm:flex sm:flex-col sm:gap-2">
        <div className="relative">
          <button
            aria-expanded={notificationsOpen}
            aria-label="Notifications"
            className={`relative grid size-10 place-items-center rounded-lg border transition sm:size-11 min-[1180px]:size-12 [&_svg]:min-[1180px]:h-6 [&_svg]:min-[1180px]:w-6 ${
              notificationsOpen
                ? "border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setCreateOpen(false);
              setFriendsOpen(false);
              setProfileOpen(false);
            }}
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
            className={`grid size-10 place-items-center rounded-lg border transition sm:size-11 min-[1180px]:size-12 [&_svg]:min-[1180px]:h-6 [&_svg]:min-[1180px]:w-6 ${
              profileActive || profileOpen
                ? "border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => {
              setProfileOpen((open) => !open);
              setCreateOpen(false);
              setFriendsOpen(false);
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
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
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
