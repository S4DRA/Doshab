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
            <form
              action="/api/private-messages"
              key={friend.id}
              method="post"
            >
              <input name="friendId" type="hidden" value={friend.id} />
              <button
                className="flex min-h-16 w-full min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 text-left transition hover:border-[#FF5F25]/70 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#FF5F25]/70"
                type="submit"
              >
                <AvatarInitials
                  imageUrl={friend.image}
                  value={friend.name || friend.email}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {friend.name || friend.email}
                  </span>
                  <span className="block truncate text-xs text-slate-400">
                    {friend.email}
                  </span>
                </span>
                <span className="hidden shrink-0 text-xs text-slate-500 sm:block">
                  {formatUserStatus(friend.status)}
                </span>
              </button>
            </form>
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
