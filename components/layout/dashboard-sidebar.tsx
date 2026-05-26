"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { LogoMark } from "@/components/ui/logo-mark";

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
  name: string;
};

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [groups, setGroups] = useState<SidebarGroup[]>([]);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    [...navItems, { href: "/dashboard/profile" }].forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    async function loadGroups() {
      const cachedGroups = window.sessionStorage.getItem("doshab-sidebar-groups");

      if (cachedGroups) {
        try {
          const parsedGroups = JSON.parse(cachedGroups) as SidebarGroup[];

          if (isMounted) {
            setGroups(parsedGroups);
          }
        } catch {
          window.sessionStorage.removeItem("doshab-sidebar-groups");
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

        const data = (await response.json()) as { groups?: SidebarGroup[] };

        if (isMounted) {
          const nextGroups = data.groups ?? [];
          setGroups(nextGroups);
          window.sessionStorage.setItem(
            "doshab-sidebar-groups",
            JSON.stringify(nextGroups),
          );
        }
      } catch {
        // Sidebar shortcuts are progressive enhancement; page navigation still works.
      }
    }

    void loadGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!pathname.startsWith("/dashboard")) {
    return null;
  }

  const profileActive = pathname.startsWith("/dashboard/profile");

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
          onClick={() => setProfileOpen((open) => !open)}
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
