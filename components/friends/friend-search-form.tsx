import { AvatarInitials } from "@/components/ui/avatar-initials";
import { SubmitButton } from "@/components/ui/submit-button";
import { formatUserStatus } from "@/lib/utils";
import type { UserStatus } from "@/types";

type FriendSearchFormProps = {
  query?: string;
  result?: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    status?: UserStatus;
  } | null;
  message?: string;
  redirectTo?: string;
};

export function FriendSearchForm({
  query,
  result,
  message,
  redirectTo = "/dashboard/friends",
}: FriendSearchFormProps) {
  return (
    <section className="app-panel p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="app-section-title">
            Add friend
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Find someone by email and invite them into your circle.
          </p>
        </div>
      </div>

      <form action="/api/friends/search" className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]" method="get">
        <input name="redirectTo" type="hidden" value={redirectTo} />
        <input
          className="h-12 rounded-lg border border-white/10 bg-[#050505] px-3 text-base text-white outline-none transition placeholder:text-slate-500 focus:border-[#FF5F25] focus:ring-2 focus:ring-[#FF5F25]/20 sm:h-11 sm:text-sm"
          defaultValue={query}
          name="email"
          placeholder="Search by email"
          type="email"
        />
        <SubmitButton
          className="app-button-primary h-12 rounded-lg px-5 text-sm font-semibold transition sm:h-11"
          pendingText="Searching..."
        >
          Search
        </SubmitButton>
      </form>

      {message ? <p className="mt-4 text-sm text-slate-400">{message}</p> : null}

      {result ? (
        <div className="app-card mt-5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <AvatarInitials imageUrl={result.image} value={result.name || result.email} />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{result.name}</p>
                <p className="truncate text-xs text-slate-400">
                  {result.email} · {formatUserStatus(result.status)}
                </p>
              </div>
            </div>
            <form action="/api/friends/requests" className="sm:shrink-0" method="post">
              <input name="receiverId" type="hidden" value={result.id} />
              <input name="redirectTo" type="hidden" value={redirectTo} />
              <SubmitButton
                className="app-button-secondary h-11 w-full rounded-lg px-4 text-sm font-semibold transition sm:h-10 sm:w-auto"
                pendingText="Sending..."
              >
                Add
              </SubmitButton>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
