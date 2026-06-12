import Link from "next/link";

import { AvatarInitials } from "@/components/ui/avatar-initials";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatReadableTimestamp } from "@/lib/utils";
import type { FriendRequestItem } from "@/types";

type FriendRequestListProps = {
  title: string;
  emptyText: string;
  requests: FriendRequestItem[];
  kind: "incoming" | "outgoing";
  emptyAction?: {
    href: string;
    label: string;
    variant?: "primary" | "secondary";
  };
};

export function FriendRequestList({
  title,
  emptyText,
  requests,
  kind,
  emptyAction,
}: FriendRequestListProps) {
  return (
    <section className="app-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">{title}</h2>
        <span className="rounded-full bg-[#FF5F25]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#FF5F25]">
          {requests.length} {requests.length === 1 ? "request" : "requests"}
        </span>
      </div>
      {requests.length ? (
        <div className="mt-5 space-y-3">
          {requests.map((request) => {
            const person = kind === "incoming" ? request.sender : request.receiver;

            return (
              <div
                className="app-row flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between"
                key={request.id}
              >
                <PersonSummary
                  createdAt={request.createdAt}
                  email={person?.email ?? ""}
                  image={person?.image}
                  name={person?.name ?? ""}
                />
                {kind === "incoming" ? (
                  <div className="flex w-full flex-wrap gap-2 sm:w-auto">
                    <form action={`/api/friends/requests/${request.id}/accept`} className="min-w-0 flex-1 sm:flex-none" method="post">
                      <SubmitButton
                        className="h-11 w-full rounded-lg bg-emerald-500 px-4 text-xs font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400 sm:h-10"
                        pendingText="Accepting..."
                      >
                        Accept
                      </SubmitButton>
                    </form>
                    <form action={`/api/friends/requests/${request.id}/reject`} className="min-w-0 flex-1 sm:flex-none" method="post">
                      <SubmitButton
                        className="app-button-secondary h-11 w-full rounded-lg px-4 text-xs font-semibold transition sm:h-10"
                        pendingText="Rejecting..."
                      >
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                ) : (
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
                    Pending
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-5">
          <p className="text-sm leading-6 text-slate-400">{emptyText}</p>
          {emptyAction ? (
            <Link
              className={`mt-4 inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition ${
                emptyAction.variant === "primary"
                  ? "app-button-primary"
                  : "app-button-secondary"
              }`}
              href={emptyAction.href}
            >
              {emptyAction.label}
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}

function PersonSummary({
  name,
  email,
  image,
  createdAt,
}: {
  name: string;
  email: string;
  image?: string | null;
  createdAt: Date;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AvatarInitials imageUrl={image} value={name || email} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">{name || email}</p>
        <p className="truncate text-xs text-slate-500">{email}</p>
        <p className="mt-1 text-xs text-slate-600">
          {formatReadableTimestamp(createdAt)}
        </p>
      </div>
    </div>
  );
}
