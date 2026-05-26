import Link from "next/link";

import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/logo-mark";
import type { DashboardGroup } from "@/types";

type GroupListProps = {
  groups: DashboardGroup[];
  selectedGroupId?: string;
  friendsActive?: boolean;
};

export function GroupList({
  groups,
  selectedGroupId,
  friendsActive = false,
}: GroupListProps) {
  return (
    <>
      <Link
        aria-label="Dashboard home"
        className={cn(
          "relative mb-3 grid size-11 place-items-center transition",
          !selectedGroupId && !friendsActive && "after:absolute after:inset-y-2 after:-left-2.5 after:w-0.5 after:rounded-full after:bg-[#FF5F25]",
        )}
        href="/dashboard"
      >
        <LogoMark className="h-10 w-10" />
      </Link>
      <Link
        aria-label="Friends"
        className={cn(
          "grid size-11 place-items-center rounded-md bg-white/7 text-slate-300 transition hover:bg-white/12 hover:text-white",
          friendsActive && "bg-white/14 text-white ring-2 ring-[#FF5F25]/70",
        )}
        href="/dashboard/friends"
        title="Friends"
      >
        <svg
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </Link>
      {groups.map((group) => (
        <Link
          aria-label={`${group.name} group`}
          className={cn(
            "grid size-11 place-items-center rounded-md bg-white/7 text-sm font-bold text-slate-300 transition hover:bg-white/12 hover:text-white",
            selectedGroupId === group.id && "bg-white/14 text-white ring-2 ring-[#FF5F25]/70",
          )}
          href={`/dashboard/groups/${group.id}`}
          key={group.id}
          title={group.name}
        >
          {getInitials(group.name)}
        </Link>
      ))}
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
