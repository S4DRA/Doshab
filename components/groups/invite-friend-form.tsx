import { SubmitButton } from "@/components/ui/submit-button";
import type { FriendPerson } from "@/types";

type InviteFriendFormProps = {
  groupId: string;
  friends: FriendPerson[];
};

export function InviteFriendForm({ groupId, friends }: InviteFriendFormProps) {
  return (
    <section className="min-w-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
        Invite
      </p>
      <h3 className="mt-1 text-lg font-semibold text-white">Invite a friend</h3>
      <p className="mt-2 max-w-prose break-words text-sm leading-6 text-slate-500">
        Owners and admins can invite accepted friends who are not already members.
      </p>

      {friends.length ? (
        <form
          action={`/api/groups/${groupId}/invites`}
          className="mt-4 grid min-w-0 gap-3 min-[760px]:grid-cols-[minmax(0,1fr)_auto]"
          method="post"
        >
          <select
            className="h-11 w-full min-w-0 max-w-full truncate rounded-md border border-white/10 bg-[#0b1020] px-3 text-sm text-slate-100 outline-none transition focus:border-[#FF5F25]/60"
            name="receiverId"
            required
          >
            {friends.map((friend) => (
              <option key={friend.id} value={friend.id}>
                {friend.name || friend.email} ({friend.email})
              </option>
            ))}
          </select>
          <SubmitButton
            className="h-11 w-full bg-[#FF5F25] px-4 text-black hover:bg-[#ff7847] min-[760px]:w-auto"
            pendingText="Inviting..."
          >
            Send invite
          </SubmitButton>
        </form>
      ) : (
        <p className="mt-4 break-words rounded-md border border-white/10 bg-[#0b1020] px-4 py-3 text-sm leading-6 text-slate-500">
          No eligible friends to invite right now.
        </p>
      )}
    </section>
  );
}
