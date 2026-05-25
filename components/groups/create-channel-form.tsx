import { SubmitButton } from "@/components/ui/submit-button";

type CreateChannelFormProps = {
  groupId: string;
};

export function CreateChannelForm({ groupId }: CreateChannelFormProps) {
  return (
    <form action={`/api/groups/${groupId}/channels`} className="space-y-3" method="post">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Channel name
        </span>
        <input
          className="mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
          maxLength={80}
          name="name"
          placeholder="planning"
          required
          type="text"
        />
      </label>
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Type
        </span>
        <select
          className="mt-2 h-10 w-full rounded-md border border-white/10 bg-[#12182a] px-3 text-sm text-white outline-none transition focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
          name="type"
        >
          <option value="TEXT">Text</option>
          <option value="VOICE">Voice</option>
        </select>
      </label>
      <SubmitButton
        className="h-10 w-full rounded-md bg-white/8 text-sm font-semibold text-slate-100 transition hover:bg-white/12"
        pendingText="Creating..."
      >
        Create channel
      </SubmitButton>
    </form>
  );
}
