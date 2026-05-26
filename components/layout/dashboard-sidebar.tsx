"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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
  {
    href: "/dashboard/messages",
    label: "Messages",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </svg>
    ),
  },
];

type SidebarGroup = {
  id: string;
  isDirectMessage?: boolean;
  name: string;
};

type SidebarFriend = {
  id: string;
  email: string;
  image?: string | null;
  name: string;
};

const sidebarCacheKey = "doshab-sidebar-v3";

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [friends, setFriends] = useState<SidebarFriend[]>([]);
  const [groups, setGroups] = useState<SidebarGroup[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
            friends?: SidebarFriend[];
            groups?: SidebarGroup[];
            notifications?: DashboardNotification[];
            unreadCount?: number;
          };

          if (isMounted) {
            setFriends(parsedSidebar.friends ?? []);
            setGroups(parsedSidebar.groups ?? []);
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
          friends?: SidebarFriend[];
          groups?: SidebarGroup[];
          notifications?: DashboardNotification[];
          unreadCount?: number;
        };

        if (isMounted) {
          const nextFriends = data.friends ?? [];
          const nextGroups = data.groups ?? [];
          const nextNotifications = data.notifications ?? [];
          const nextUnreadCount = data.unreadCount ?? 0;
          setFriends(nextFriends);
          setGroups(nextGroups);
          setNotifications(nextNotifications);
          setUnreadCount(nextUnreadCount);
          window.sessionStorage.setItem(
            sidebarCacheKey,
            JSON.stringify({
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
  }, []);

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

  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-14 flex-col items-center border-r border-white/70 bg-[#050505] px-1.5 py-2 text-white sm:w-16 sm:px-2 sm:py-3">
      <Link
        aria-label="Dashboard"
        className="grid size-10 place-items-center rounded-xl transition hover:bg-white/10 sm:size-11"
        href="/dashboard"
        onMouseEnter={() => router.prefetch("/dashboard")}
      >
        <LogoMark className="h-9 w-9 sm:h-10 sm:w-10" />
      </Link>

      <div className="relative mt-3">
        {createOpen ? (
          <div className="absolute left-12 top-0 w-[calc(100vw-4.25rem)] max-w-72 rounded-2xl border border-white/30 bg-[#111111] p-3 shadow-2xl shadow-black/50 sm:left-14">
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
                className="h-10 w-full rounded-xl border border-white/20 bg-[#050505] px-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#FF5F25]"
                maxLength={80}
                name="name"
                placeholder="Create a group"
                required
                type="text"
              />
              <button
                className="h-10 w-full rounded-xl bg-[#FF5F25] text-sm font-bold text-black transition hover:bg-[#ff7847]"
                type="submit"
              >
                Create group
              </button>
            </form>

            <div className="my-3 h-px bg-white/20" />

            <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
              Send PM
            </p>
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {friends.length ? (
                friends.map((friend) => (
                  <form
                    action="/api/private-messages"
                    key={friend.id}
                    method="post"
                    onSubmit={() => {
                      window.sessionStorage.removeItem(sidebarCacheKey);
                    }}
                  >
                    <input name="friendId" type="hidden" value={friend.id} />
                    <button
                      className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-white/10"
                      type="submit"
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/20 bg-[#050505] text-xs font-black text-white">
                        {getInitials(friend.name || friend.email)}
                      </span>
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
        ) : null}
        <button
          aria-expanded={createOpen}
          aria-label="Create menu"
          className={`grid size-10 place-items-center rounded-xl border transition sm:size-11 ${
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

      <div className="relative mt-1.5 sm:mt-2">
        {notificationsOpen ? (
          <div className="absolute left-12 top-0 w-[calc(100vw-4.25rem)] max-w-80 rounded-2xl border border-white/30 bg-[#111111] p-3 shadow-2xl shadow-black/50 sm:left-14">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
                  Notifications
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  PMs and group messages
                </p>
              </div>
              {unreadCount ? (
                <button
                  className="rounded-full border border-white/20 px-2 py-1 text-xs font-semibold text-white transition hover:border-[#FF5F25] hover:text-[#FF5F25]"
                  onClick={markNotificationsRead}
                  type="button"
                >
                  Read
                </button>
              ) : null}
            </div>

            <div className="mt-3 max-h-72 space-y-1 overflow-y-auto pr-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {notifications.length ? (
                notifications.map((notification) => (
                  <Link
                    className={`block rounded-xl border px-3 py-2.5 transition hover:border-[#FF5F25]/70 hover:bg-white/10 ${
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
                <p className="rounded-xl border border-dashed border-white/20 px-3 py-4 text-sm leading-6 text-slate-400">
                  No notifications yet. New PMs and group messages will appear here.
                </p>
              )}
            </div>
          </div>
        ) : null}
        <button
          aria-expanded={notificationsOpen}
          aria-label="Notifications"
          className={`relative grid size-10 place-items-center rounded-xl border transition sm:size-11 ${
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

      <nav
        className="mt-3 flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto overscroll-contain pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:mt-4 sm:gap-2 [&::-webkit-scrollbar]:hidden"
        aria-label="Dashboard"
      >
        {navItems.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              aria-label={item.label}
              className={`grid size-10 shrink-0 place-items-center rounded-xl border transition sm:size-11 ${
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
        {groups.length ? (
          <div className="my-1.5 h-px w-8 shrink-0 bg-white/50 sm:my-2" />
        ) : null}
        {groups.map((group) => {
          const href = `/dashboard/groups/${group.id}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);

          return (
            <Link
              aria-label={`${group.name} group`}
              className={`grid size-10 shrink-0 place-items-center rounded-xl border text-sm font-black transition sm:size-11 ${
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
              {getInitials(group.name)}
            </Link>
          );
        })}
      </nav>

      <div className="relative">
        {profileOpen ? (
          <div className="absolute bottom-0 left-12 w-[calc(100vw-4.25rem)] max-w-44 rounded-2xl border border-white/30 bg-[#111111] p-2 shadow-2xl shadow-black/50 sm:left-14">
            <Link
              className="block rounded-xl px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              href="/dashboard/profile"
              onClick={() => setProfileOpen(false)}
              onMouseEnter={() => router.prefetch("/dashboard/profile")}
              onPointerDown={() => router.prefetch("/dashboard/profile")}
            >
              Settings
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                className="mt-1 w-full rounded-xl px-3 py-2 text-left text-sm font-semibold text-[#FF5F25] transition hover:bg-[#FF5F25] hover:text-black"
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>
        ) : null}
        <button
          aria-expanded={profileOpen}
          aria-label="Profile menu"
          className={`grid size-10 place-items-center rounded-xl border transition sm:size-11 ${
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
          <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21a8 8 0 0 1 16 0" />
          </svg>
        </button>
      </div>
    </aside>
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
