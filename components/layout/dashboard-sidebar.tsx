"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

const sidebarCacheKey = "doshab-sidebar-v6";

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
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SidebarUser | null>(initialCurrentUser);
  const [friends, setFriends] = useState<SidebarFriend[]>(initialFriends);
  const [groups, setGroups] = useState<SidebarGroup[]>(initialGroups);
  const [notifications, setNotifications] = useState<DashboardNotification[]>(
    initialNotifications,
  );
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [createOpen, setCreateOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    [...navItems, { href: "/dashboard/profile" }].forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  useEffect(() => {
    groups.slice(0, 12).forEach((group) => {
      router.prefetch(`/dashboard/groups/${group.id}`);
    });
  }, [groups, router]);

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
    const refreshTimer = window.setInterval(loadGroups, 15000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [initialCurrentUser, initialGroups]);

  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  const profileActive = pathname.startsWith("/dashboard/profile");

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

  const createMenu = createOpen ? (
    <div className="app-surface fixed bottom-20 left-3 right-3 z-50 max-h-[70vh] max-w-sm overflow-y-auto rounded-lg p-3 sm:absolute sm:bottom-auto sm:left-14 sm:right-auto sm:top-32 sm:w-[calc(100vw-4.25rem)] sm:max-w-72">
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
          className="h-10 w-full rounded-lg border border-white/20 bg-[#050505] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#FF5F25]"
          maxLength={80}
          name="name"
          placeholder="Create a space"
          required
          type="text"
        />
        <button
          className="app-button-primary h-10 w-full rounded-lg text-sm font-bold transition"
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
                  className="app-icon-button h-8 w-8"
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
          >
            Add friends first
          </Link>
        )}
      </div>
    </div>
  ) : null;

  const notificationMenu = notificationsOpen ? (
    <div className="app-surface fixed left-3 right-3 top-14 z-50 max-w-sm rounded-lg p-3 sm:absolute sm:bottom-0 sm:left-14 sm:right-auto sm:top-auto sm:w-[calc(100vw-4.25rem)] sm:max-w-80">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Notifications
          </p>
          <p className="mt-1 text-xs text-slate-400">
            PMs and space messages
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount ? (
            <button
              className="rounded-lg border border-white/20 px-2 py-1 text-xs font-semibold text-white transition hover:border-[#FF5F25] hover:text-[#FF5F25]"
              onClick={markNotificationsRead}
              type="button"
            >
              Read
            </button>
          ) : null}
          {notifications.length ? (
            <button
              className="rounded-lg border border-white/20 px-2 py-1 text-xs font-semibold text-white transition hover:border-[#FF5F25] hover:text-[#FF5F25]"
              onClick={clearNotifications}
              type="button"
            >
              Clear
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {notifications.length ? (
          notifications.map((notification) => (
            <Link
              className={`block rounded-lg border px-3 py-2.5 transition hover:border-[#FF5F25]/70 hover:bg-white/10 ${
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
              <span className="block truncate text-sm font-semibold text-white">
                {notification.title}
              </span>
              <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-300">
                {notification.body}
              </span>
              <span className="mt-1 block text-[11px] text-slate-500">
                {formatNotificationTime(notification.createdAt)}
              </span>
            </Link>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-white/20 px-3 py-4 text-sm leading-6 text-slate-400">
            No notifications yet. New PMs and space messages will appear here.
          </p>
        )}
      </div>
      <PushNotificationToggle />
    </div>
  ) : null;

  const profileMenu = profileOpen ? (
    <div className="app-surface fixed right-3 top-14 z-50 w-[calc(100vw-1.5rem)] max-w-44 rounded-lg p-2 sm:absolute sm:bottom-0 sm:left-14 sm:right-auto sm:top-auto sm:w-[calc(100vw-4.25rem)]">
      <Link
        className="block rounded-lg px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
        href="/dashboard/profile"
        onClick={() => setProfileOpen(false)}
        onMouseEnter={() => router.prefetch("/dashboard/profile")}
        onPointerDown={() => router.prefetch("/dashboard/profile")}
      >
        Settings
      </Link>
      <form action="/api/auth/logout" method="post">
        <button
          className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#FF5F25] transition hover:bg-[#FF5F25] hover:text-black"
          type="submit"
        >
          Log out
        </button>
      </form>
    </div>
  ) : null;

  return (
    <>
    <div className="fixed right-3 top-2 z-50 flex items-center gap-2 sm:hidden">
      <button
        aria-expanded={notificationsOpen}
        aria-label="Notifications"
        className={`relative grid size-10 place-items-center rounded-lg border bg-[#090c0a]/95 text-white shadow-[0_12px_36px_-24px_rgba(0,0,0,0.9)] backdrop-blur transition ${
          notificationsOpen
            ? "border-[#FF5F25] text-[#FF5F25]"
            : "border-white/10 text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
        }`}
        onClick={() => {
          setNotificationsOpen((open) => !open);
          setCreateOpen(false);
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

      <button
        aria-expanded={profileOpen}
        aria-label="Profile menu"
        className={`grid size-10 place-items-center rounded-lg border bg-[#090c0a]/95 text-white shadow-[0_12px_36px_-24px_rgba(0,0,0,0.9)] backdrop-blur transition ${
          profileActive || profileOpen
            ? "border-[#FF5F25] text-[#FF5F25]"
            : "border-white/10 text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
        }`}
        onClick={() => {
          setProfileOpen((open) => !open);
          setCreateOpen(false);
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

    <aside className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center border-t border-white/10 bg-[#090c0a]/95 px-2 text-white shadow-[0_-12px_48px_-36px_rgba(0,0,0,0.9)] backdrop-blur sm:inset-x-auto sm:inset-y-0 sm:left-0 sm:h-auto sm:w-16 sm:flex-col sm:border-r sm:border-t-0 sm:px-2 sm:py-3 sm:shadow-[12px_0_48px_-36px_rgba(0,0,0,0.9)]">
      {createMenu}
      {notificationMenu}
      {profileMenu}
      <Link
        aria-label="Dashboard"
        className="hidden size-10 place-items-center transition sm:grid sm:size-11"
        href="/dashboard"
        onMouseEnter={() => router.prefetch("/dashboard")}
      >
        <LogoMark className="h-9 w-9 sm:h-10 sm:w-10" />
      </Link>

      <nav
        className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto overscroll-contain px-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-4 sm:min-h-0 sm:flex-col sm:items-center sm:gap-2 sm:overflow-x-hidden sm:overflow-y-auto sm:px-0 sm:pb-2 [&::-webkit-scrollbar]:hidden"
        aria-label="Dashboard"
      >
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              aria-label={item.label}
              className={`grid size-10 shrink-0 place-items-center rounded-lg border transition sm:size-11 ${
                active
                  ? "border-[#FF5F25] text-[#FF5F25]"
                  : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
              }`}
              href={item.href}
              key={item.href}
              onMouseEnter={() => router.prefetch(item.href)}
              onPointerDown={() => router.prefetch(item.href)}
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
            className={`grid size-10 shrink-0 place-items-center rounded-lg border transition sm:size-11 ${
              createOpen
                ? "border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => {
              setCreateOpen((open) => !open);
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
              className={`grid size-10 shrink-0 place-items-center rounded-lg border text-sm font-black transition sm:size-11 ${
                active
                  ? "border-[#FF5F25] text-[#FF5F25]"
                  : "border-transparent bg-white/7 text-slate-200 hover:border-white/40 hover:bg-white/10 hover:text-white"
              }`}
              href={href}
              key={group.id}
              onMouseEnter={() => router.prefetch(href)}
              onPointerDown={() => router.prefetch(href)}
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
            className={`relative grid size-10 place-items-center rounded-lg border transition sm:size-11 ${
              notificationsOpen
                ? "border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setCreateOpen(false);
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
            className={`grid size-10 place-items-center rounded-lg border transition sm:size-11 ${
              profileActive || profileOpen
                ? "border-[#FF5F25] text-[#FF5F25]"
                : "border-transparent text-slate-300 hover:border-white/40 hover:bg-white/10 hover:text-white"
            }`}
            onClick={() => {
              setProfileOpen((open) => !open);
              setCreateOpen(false);
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
