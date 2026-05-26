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
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/10">
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
                className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#0c1421] p-4 shadow-inner shadow-black/10 sm:flex-row sm:items-center sm:justify-between"
                key={request.id}
              >
                <PersonSummary
                  createdAt={request.createdAt}
                  email={person?.email ?? ""}
                  image={person?.image}
                  name={person?.name ?? ""}
                />
                {kind === "incoming" ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={`/api/friends/requests/${request.id}/accept`} method="post">
                      <SubmitButton
                        className="h-10 rounded-full bg-emerald-500 px-4 text-xs font-semibold text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-400"
                        pendingText="Accepting..."
                      >
                        Accept
                      </SubmitButton>
                    </form>
                    <form action={`/api/friends/requests/${request.id}/reject`} method="post">
                      <SubmitButton
                        className="h-10 rounded-full bg-white/10 px-4 text-xs font-semibold text-slate-200 shadow-sm shadow-black/20 transition hover:bg-white/15"
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
        <p className="mt-5 text-sm leading-6 text-slate-400">{emptyText}</p>
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
