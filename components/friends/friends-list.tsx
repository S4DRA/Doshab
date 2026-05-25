import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { FriendPerson } from "@/types";

type FriendsListProps = {
  friends: FriendPerson[];
};

export function FriendsList({ friends }: FriendsListProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <h2 className="text-base font-semibold text-white">Friends</h2>
      {friends.length ? (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {friends.map((friend) => (
            <div
              className="flex min-w-0 items-center gap-3 rounded-md border border-white/10 bg-[#0b1020] p-3"
              key={friend.id}
            >
              <AvatarInitials value={friend.name || friend.email} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">
                  {friend.name || friend.email}
                </p>
                <p className="truncate text-xs text-slate-500">{friend.email}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Accepted friends will appear here.
        </p>
      )}
    </section>
  );
}
