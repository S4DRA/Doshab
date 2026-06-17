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
        <div className="flex min-w-0 items-center gap-3">
          <span className="dashboard-glyph" aria-hidden="true">
            {kind === "incoming" ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M15 10h4l-4-4" />
                <path d="M19 10H9a5 5 0 0 0 0 10h1" />
                <path d="M12 7a4 4 0 1 0-8 0" />
                <path d="M2 21a6 6 0 0 1 10 0" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path d="M9 10H5l4-4" />
                <path d="M5 10h10a5 5 0 0 1 0 10h-1" />
                <path d="M12 7a4 4 0 1 0-8 0" />
                <path d="M2 21a6 6 0 0 1 10 0" />
              </svg>
            )}
          </span>
          <h2 className="min-w-0 text-base font-bold text-white">{title}</h2>
        </div>
        <span className="app-badge px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
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
                        className="app-button-primary h-11 w-full rounded-lg px-4 text-xs font-semibold transition sm:h-10"
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
                  <span className="app-badge px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em]">
                    Pending
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="app-empty-state mt-5">
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
