import Link from "next/link";

import { AvatarInitials } from "@/components/ui/avatar-initials";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatReadableTimestamp } from "@/lib/utils";
import type { GroupInviteItem } from "@/types";

type GroupInvitesListProps = {
  invites: GroupInviteItem[];
  emptyActions?: Array<{
    href: string;
    label: string;
    variant?: "primary" | "secondary";
  }>;
};

export function GroupInvitesList({ invites, emptyActions }: GroupInvitesListProps) {
  return (
    <section className="app-panel p-5">
      <p className="app-section-title">Invites</p>
      <h2 className="mt-2 text-base font-semibold text-white">Space invites</h2>
      {invites.length ? (
        <div className="mt-4 space-y-3">
          {invites.map((invite) => (
            <div
                className="app-row flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              key={invite.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <AvatarInitials
                  fallback="group"
                  imageUrl={invite.group.image}
                  value={invite.group.name}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {invite.group.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Invited by {invite.inviter.name || invite.inviter.email}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {formatReadableTimestamp(invite.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <form action={`/api/groups/invites/${invite.id}/accept`} className="min-w-0 flex-1 sm:flex-none" method="post">
                  <SubmitButton
                    className="h-11 w-full rounded-lg bg-emerald-500/20 px-3 text-xs text-emerald-100 hover:bg-emerald-500/30 sm:h-9"
                    pendingText="Accepting..."
                  >
                    Accept
                  </SubmitButton>
                </form>
                <form action={`/api/groups/invites/${invite.id}/reject`} className="min-w-0 flex-1 sm:flex-none" method="post">
                  <SubmitButton
                    className="app-button-secondary h-11 w-full rounded-lg px-3 text-xs transition sm:h-9"
                    pendingText="Rejecting..."
                  >
                    Reject
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm leading-6 text-slate-500">
            No pending invites. New space invitations will appear here with accept and reject actions.
          </p>
          {emptyActions?.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {emptyActions.map((action) => (
                <Link
                  className={`inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold transition ${
                    action.variant === "primary"
                      ? "app-button-primary"
                      : "app-button-secondary"
                  }`}
                  href={action.href}
                  key={`${action.href}:${action.label}`}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
