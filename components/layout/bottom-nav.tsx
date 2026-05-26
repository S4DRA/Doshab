"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12L12 3l9 9" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    href: "/dashboard/friends",
    label: "Friends",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    href: "/dashboard/channels",
    label: "Channels",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16" />
        <path d="M7 12h13" />
        <path d="M4 18h16" />
        <path d="M8 3 6 21" />
        <path d="m18 3-2 18" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => {
    navItems.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  if (pathname === "/login" || pathname === "/register") {
    return null;
  }

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex h-14 w-full max-w-[520px] items-center justify-between gap-1 rounded-2xl border border-[color:var(--border-soft)] bg-[color:var(--surface-panel)] px-2 text-[color:var(--text-high)]">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
          const isPending = pendingHref === item.href && !isActive;
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setPendingHref(item.href)}
              onMouseEnter={() => router.prefetch(item.href)}
              onTouchStart={() => router.prefetch(item.href)}
              className={`group inline-flex min-h-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-transparent px-1.5 py-1 text-[10px] font-semibold tracking-normal transition sm:flex-row sm:gap-1.5 sm:rounded-full sm:px-2 sm:text-xs ${
                isActive || isPending
                  ? "text-[#FF5F25]"
                  : "border-transparent text-[color:var(--text-muted)] hover:border-[color:var(--border-soft)] hover:bg-[color:var(--surface-hover)] hover:text-[color:var(--text-high)]"
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${
                  isActive || isPending
                    ? "border-[#FF5F25] bg-transparent text-[#FF5F25]"
                    : "border-transparent text-[color:var(--text-body)]"
                }`}
              >
                {item.icon}
              </span>
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
