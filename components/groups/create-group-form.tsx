import { SubmitButton } from "@/components/ui/submit-button";

type CreateGroupFormProps = {
  compact?: boolean;
};

export function CreateGroupForm({ compact = false }: CreateGroupFormProps) {
  return (
    <form action="/api/groups" className="space-y-3" method="post">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Group name
        </span>
        <input
          className="mt-2 h-10 w-full rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
          maxLength={80}
          name="name"
          placeholder="Weekend crew"
          required
          type="text"
        />
      </label>
      {!compact ? (
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Description
          </span>
          <textarea
            className="mt-2 min-h-20 w-full resize-none rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
            maxLength={180}
            name="description"
            placeholder="Optional"
          />
        </label>
      ) : null}
      <SubmitButton
        className="h-10 w-full rounded-md bg-indigo-500 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400"
        pendingText="Creating..."
      >
        Create group
      </SubmitButton>
    </form>
  );
}
