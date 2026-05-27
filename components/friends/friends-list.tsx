import { AvatarInitials } from "@/components/ui/avatar-initials";
import { formatUserStatus } from "@/lib/utils";
import type { FriendPerson } from "@/types";

type FriendsListProps = {
  friends: FriendPerson[];
};

export function FriendsList({ friends }: FriendsListProps) {
  return (
    <section className="grid gap-2">
      {friends.length ? (
        <>
          {friends.map((friend) => (
            <div
              className="flex min-h-16 w-full min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 transition hover:border-[#FF5F25]/70 hover:bg-white/10"
              key={friend.id}
            >
              <AvatarInitials
                imageUrl={friend.image}
                value={friend.name || friend.email}
              />
              <form action="/api/private-messages" className="min-w-0 flex-1" method="post">
                <input name="friendId" type="hidden" value={friend.id} />
                <button className="w-full min-w-0 text-left" type="submit">
                  <span className="block truncate text-sm font-semibold text-white">
                    {friend.name || friend.email}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {friend.email}
                  </span>
                </button>
              </form>
              <span className="hidden shrink-0 text-xs text-slate-500 sm:block">
                {formatUserStatus(friend.status)}
              </span>
              <form action="/api/friend-calls/start" method="post">
                <input name="friendId" type="hidden" value={friend.id} />
                <button
                  className="h-9 rounded-lg border border-white/15 px-3 text-xs font-semibold text-slate-200 transition hover:border-[#FF5F25] hover:text-white"
                  type="submit"
                >
                  Call
                </button>
              </form>
            </div>
          ))}
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-5 text-sm leading-6 text-slate-400">
          Accepted friends will appear here.
        </p>
      )}
    </section>
  );
}
