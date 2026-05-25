import { AvatarInitials } from "@/components/ui/avatar-initials";
import { SubmitButton } from "@/components/ui/submit-button";

type FriendSearchFormProps = {
  query?: string;
  result?: {
    id: string;
    name: string;
    email: string;
  } | null;
  message?: string;
};

export function FriendSearchForm({ query, result, message }: FriendSearchFormProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
        Add friend
      </p>
      <form action="/api/friends/search" className="mt-4 flex gap-3" method="get">
        <input
          className="h-11 flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-300/20"
          defaultValue={query}
          name="email"
          placeholder="Search by email"
          type="email"
        />
        <SubmitButton
          className="h-11 rounded-md bg-indigo-500 px-4 text-sm font-semibold text-white shadow-lg shadow-indigo-950/30 transition hover:bg-indigo-400"
          pendingText="Searching..."
        >
          Search
        </SubmitButton>
      </form>

      {message ? <p className="mt-3 text-sm text-slate-400">{message}</p> : null}

      {result ? (
        <div className="mt-4 flex items-center justify-between rounded-md border border-white/10 bg-[#0b1020] p-3">
          <div className="flex min-w-0 items-center gap-3">
            <AvatarInitials value={result.name || result.email} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{result.name}</p>
              <p className="truncate text-xs text-slate-500">{result.email}</p>
            </div>
          </div>
          <form action="/api/friends/requests" method="post">
            <input name="receiverId" type="hidden" value={result.id} />
            <SubmitButton
              className="h-9 rounded-md bg-white/8 px-3 text-xs font-semibold text-slate-100 transition hover:bg-white/12"
              pendingText="Sending..."
            >
              Add
            </SubmitButton>
          </form>
        </div>
      ) : null}
    </section>
  );
}
