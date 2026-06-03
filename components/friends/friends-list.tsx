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
              className="app-row flex min-h-16 w-full min-w-0 items-center gap-3 px-3 py-3 transition"
              key={friend.id}
            >
              <AvatarInitials
                imageUrl={friend.image}
                value={friend.name || friend.email}
              />
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                  {friend.name || friend.email}
                </span>
                <span className="block truncate text-xs text-slate-400">
                  {friend.email}
                </span>
              </div>
              <span className="hidden shrink-0 items-center gap-2 text-xs text-slate-500 sm:flex">
                <span className="app-status-dot" data-status={friend.status ?? "OFFLINE"} />
                {formatUserStatus(friend.status)}
              </span>
              <form action="/api/private-messages" method="post">
                <input name="friendId" type="hidden" value={friend.id} />
                <button
                  aria-label={`Message ${friend.name || friend.email}`}
                  className="app-icon-button h-11 w-11 sm:h-9 sm:w-9"
                  title={`Message ${friend.name || friend.email}`}
                  type="submit"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
                  </svg>
                </button>
              </form>
              <form action="/api/friend-calls/start" method="post">
                <input name="friendId" type="hidden" value={friend.id} />
                <button
                  aria-label={`Call ${friend.name || friend.email}`}
                  className="app-icon-button app-icon-button-primary h-11 w-11 sm:h-9 sm:w-9"
                  title={`Call ${friend.name || friend.email}`}
                  type="submit"
                >
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.35 1.89.66 2.78a2 2 0 0 1-.45 2.11L8.05 9.88a16 16 0 0 0 6.07 6.07l1.27-1.27a2 2 0 0 1 2.11-.45c.89.31 1.82.53 2.78.66A2 2 0 0 1 22 16.92Z" />
                  </svg>
                </button>
              </form>
            </div>
          ))}
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-white/15 bg-white/[0.04] px-4 py-5 text-sm leading-6 text-slate-400">
          No friends yet. Search by email to send your first request.
        </p>
      )}
    </section>
  );
}
