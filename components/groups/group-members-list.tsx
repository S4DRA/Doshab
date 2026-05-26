import { AvatarInitials } from "@/components/ui/avatar-initials";
import { formatReadableTimestamp, formatUserStatus } from "@/lib/utils";
import type { GroupMemberItem } from "@/types";

type GroupMembersListProps = {
  members: GroupMemberItem[];
};

export function GroupMembersList({ members }: GroupMembersListProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
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
        <div className="mt-4 space-y-3">
          {members.map((member) => (
            <div
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-[#0b1020] p-3"
              key={member.id}
            >
              <div className="flex min-w-0 items-center gap-3">
                <AvatarInitials
                  imageUrl={member.user.image}
                  value={member.user.name || member.user.email}
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">
                    {member.user.name || member.user.email}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {member.user.email} · {formatUserStatus(member.user.status)}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Joined {formatReadableTimestamp(member.createdAt)}
                  </p>
                </div>
              </div>
              <span className="rounded-md border border-white/10 bg-white/7 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300">
                {member.role.toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Members will appear here as people join this group.
        </p>
      )}
    </section>
  );
}
