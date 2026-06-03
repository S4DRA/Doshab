import { AvatarInitials } from "@/components/ui/avatar-initials";
import { formatReadableTimestamp, formatUserStatus } from "@/lib/utils";
import type { GroupMemberItem } from "@/types";

type GroupMembersListProps = {
  currentUserId?: string;
  members: GroupMemberItem[];
};

export function GroupMembersList({ currentUserId, members }: GroupMembersListProps) {
  return (
    <section className="app-panel min-w-0 p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
            Members
          </p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            {members.length} {members.length === 1 ? "member" : "members"}
          </h3>
        </div>
      </div>

      {members.length ? (
        <div className="mt-4 min-w-0 space-y-3">
          {members.map((member) => (
            <div
              className="app-row flex min-w-0 flex-col items-start gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
              key={member.id}
            >
              <div className="flex w-full min-w-0 flex-1 items-center gap-3">
                <AvatarInitials
                  imageUrl={member.user.image}
                  value={member.user.name || member.user.email}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {member.user.name || member.user.email}
                  </p>
                  <p className="flex flex-wrap items-center gap-2 break-words text-xs text-slate-500 sm:truncate">
                    <span className="app-status-dot" data-status={member.user.status ?? "OFFLINE"} />
                    <span>{member.user.email}</span>
                    <span>{formatUserStatus(member.user.status)}</span>
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-600 sm:truncate">
                    Joined {formatReadableTimestamp(member.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="app-badge px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] sm:text-[11px] sm:tracking-[0.14em]">
                  {member.role.toLowerCase()}
                </span>
                {currentUserId && member.user.id !== currentUserId ? (
                  <>
                    <form action="/api/private-messages" method="post">
                      <input name="friendId" type="hidden" value={member.user.id} />
                      <button
                        aria-label={`Message ${member.user.name || member.user.email}`}
                        className="app-icon-button h-10 w-10 sm:h-8 sm:w-8"
                        title={`Message ${member.user.name || member.user.email}`}
                        type="submit"
                      >
                        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                        </svg>
                      </button>
                    </form>
                    <form action="/api/friend-calls/start" method="post">
                      <input name="friendId" type="hidden" value={member.user.id} />
                      <button
                        aria-label={`Call ${member.user.name || member.user.email}`}
                        className="app-icon-button app-icon-button-primary h-10 w-10 sm:h-8 sm:w-8"
                        title={`Call ${member.user.name || member.user.email}`}
                        type="submit"
                      >
                        <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.05 9.88a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92Z" />
                        </svg>
                      </button>
                    </form>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          No members yet. Invited friends will appear here after they join.
        </p>
      )}
    </section>
  );
}
