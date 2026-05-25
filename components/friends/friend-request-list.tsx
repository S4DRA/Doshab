import { AvatarInitials } from "@/components/ui/avatar-initials";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatReadableTimestamp } from "@/lib/utils";
import type { FriendRequestItem } from "@/types";

type FriendRequestListProps = {
  title: string;
  emptyText: string;
  requests: FriendRequestItem[];
  kind: "incoming" | "outgoing";
};

export function FriendRequestList({
  title,
  emptyText,
  requests,
  kind,
}: FriendRequestListProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-base font-semibold text-white">{title}</h2>
      {requests.length ? (
        <div className="mt-4 space-y-3">
          {requests.map((request) => {
            const person = kind === "incoming" ? request.sender : request.receiver;

            return (
              <div
                className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-[#0b1020] p-3"
                key={request.id}
              >
                <PersonSummary
                  createdAt={request.createdAt}
                  email={person?.email ?? ""}
                  name={person?.name ?? ""}
                />
                {kind === "incoming" ? (
                  <div className="flex gap-2">
                    <form action={`/api/friends/requests/${request.id}/accept`} method="post">
                      <SubmitButton
                        className="h-9 rounded-md bg-emerald-500/20 px-3 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                        pendingText="Accepting..."
                      >
                        Accept
                      </SubmitButton>
                    </form>
                    <form action={`/api/friends/requests/${request.id}/reject`} method="post">
                      <SubmitButton
                        className="h-9 rounded-md bg-white/8 px-3 text-xs font-semibold text-slate-200 transition hover:bg-white/12"
                        pendingText="Rejecting..."
                      >
                        Reject
                      </SubmitButton>
                    </form>
                  </div>
                ) : (
                  <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                    Pending
                  </span>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">{emptyText}</p>
      )}
    </section>
  );
}

function PersonSummary({
  name,
  email,
  createdAt,
}: {
  name: string;
  email: string;
  createdAt: Date;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <AvatarInitials value={name || email} />
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
