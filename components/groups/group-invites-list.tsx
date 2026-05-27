import { AvatarInitials } from "@/components/ui/avatar-initials";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatReadableTimestamp } from "@/lib/utils";
import type { GroupInviteItem } from "@/types";

type GroupInvitesListProps = {
  invites: GroupInviteItem[];
};

export function GroupInvitesList({ invites }: GroupInvitesListProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-base font-semibold text-white">Space invites</h2>
      {invites.length ? (
        <div className="mt-4 space-y-3">
          {invites.map((invite) => (
            <div
              className="flex flex-col gap-3 rounded-md border border-white/10 bg-[#0b1020] p-3 sm:flex-row sm:items-center sm:justify-between"
              key={invite.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <AvatarInitials
                  imageUrl={invite.inviter.image}
                  value={invite.inviter.name || invite.inviter.email}
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
              <div className="flex gap-2">
                <form action={`/api/groups/invites/${invite.id}/accept`} method="post">
                  <SubmitButton
                    className="h-9 bg-emerald-500/20 px-3 text-xs text-emerald-100 hover:bg-emerald-500/30"
                    pendingText="Accepting..."
                  >
                    Accept
                  </SubmitButton>
                </form>
                <form action={`/api/groups/invites/${invite.id}/reject`} method="post">
                  <SubmitButton
                    className="h-9 bg-white/8 px-3 text-xs text-slate-200 hover:bg-white/12"
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
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Space invites from friends will appear here.
        </p>
      )}
    </section>
  );
}
