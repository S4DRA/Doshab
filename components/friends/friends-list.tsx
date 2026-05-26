import { AvatarInitials } from "@/components/ui/avatar-initials";
import { formatUserStatus } from "@/lib/utils";
import type { FriendPerson } from "@/types";

type FriendsListProps = {
  friends: FriendPerson[];
};

export function FriendsList({ friends }: FriendsListProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-sm shadow-black/10">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-white">Friends</h2>
        <span className="text-sm text-slate-400">{friends.length} connected</span>
      </div>
      {friends.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {friends.map((friend) => (
            <div
              className="flex min-w-0 items-center gap-3 rounded-3xl border border-white/10 bg-[#0c1421] p-4 shadow-inner shadow-black/10"
              key={friend.id}
            >
              <AvatarInitials
                imageUrl={friend.image}
                value={friend.name || friend.email}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {friend.name || friend.email}
                </p>
                <p className="truncate text-xs text-slate-400">
                  {friend.email}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formatUserStatus(friend.status)}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-6 text-slate-400">
          Accepted friends will appear here.
        </p>
      )}
    </section>
  );
}
