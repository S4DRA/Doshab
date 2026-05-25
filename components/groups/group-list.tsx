import Link from "next/link";

import { cn } from "@/lib/utils";
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
          "mb-3 grid size-11 place-items-center rounded-md bg-indigo-500 font-black text-white shadow-lg shadow-indigo-950/40",
          !selectedGroupId && !friendsActive && "ring-2 ring-indigo-200/70",
        )}
        href="/dashboard"
      >
        P
      </Link>
      <Link
        aria-label="Friends"
        className={cn(
          "grid size-11 place-items-center rounded-md bg-white/7 text-xs font-bold text-slate-300 transition hover:bg-white/12 hover:text-white",
          friendsActive && "bg-white/14 text-white ring-2 ring-indigo-300/70",
        )}
        href="/dashboard/friends"
        title="Friends"
      >
        Fr
      </Link>
      {groups.map((group) => (
        <Link
          aria-label={`${group.name} group`}
          className={cn(
            "grid size-11 place-items-center rounded-md bg-white/7 text-sm font-bold text-slate-300 transition hover:bg-white/12 hover:text-white",
            selectedGroupId === group.id && "bg-white/14 text-white ring-2 ring-indigo-300/70",
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
