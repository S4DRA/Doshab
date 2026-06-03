import { SubmitButton } from "@/components/ui/submit-button";

type CreateGroupFormProps = {
  compact?: boolean;
};

export function CreateGroupForm({ compact = false }: CreateGroupFormProps) {
  return (
    <form action="/api/groups" className="space-y-3" method="post">
      <label className="block">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
          Space name
        </span>
        <input
          className="mt-2 h-12 w-full rounded-xl border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
          maxLength={80}
          name="name"
          placeholder="Weekend crew"
          required
          type="text"
        />
      </label>
      {!compact ? (
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
            Description
          </span>
          <textarea
            className="mt-2 min-h-24 w-full resize-none rounded-xl border border-white/10 bg-[#050505] px-3 py-2 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:min-h-20 sm:text-sm"
            maxLength={180}
            name="description"
            placeholder="Optional"
          />
        </label>
      ) : null}
      <SubmitButton
        className="h-12 w-full rounded-xl bg-[#FF5F25] text-sm font-bold text-black transition hover:bg-[#ff7847] sm:h-11"
        pendingText="Creating..."
      >
        Create space
      </SubmitButton>
    </form>
  );
}
