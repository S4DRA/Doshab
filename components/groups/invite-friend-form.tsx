import { SubmitButton } from "@/components/ui/submit-button";
import type { FriendPerson } from "@/types";

type InviteFriendFormProps = {
  groupId: string;
  friends: FriendPerson[];
};

export function InviteFriendForm({ groupId, friends }: InviteFriendFormProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
        Invite
      </p>
      <h3 className="mt-1 text-lg font-semibold text-white">Invite a friend</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Owners and admins can invite accepted friends who are not already members.
      </p>

      {friends.length ? (
        <form
          action={`/api/groups/${groupId}/invites`}
          className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]"
          method="post"
        >
          <select
            className="h-11 rounded-md border border-white/10 bg-[#0b1020] px-3 text-sm text-slate-100 outline-none transition focus:border-indigo-300/60"
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
            className="h-11 bg-indigo-500 px-4 text-white hover:bg-indigo-400"
            pendingText="Inviting..."
          >
            Send invite
          </SubmitButton>
        </form>
      ) : (
        <p className="mt-4 rounded-md border border-white/10 bg-[#0b1020] px-4 py-3 text-sm leading-6 text-slate-500">
          No eligible friends to invite right now.
        </p>
      )}
    </section>
  );
}
