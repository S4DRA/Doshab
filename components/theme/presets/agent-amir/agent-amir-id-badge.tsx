import { AvatarInitials } from "@/components/ui/avatar-initials";
import type { UserStatus } from "@/types";

type AgentAmirIdBadgeProps = {
  email: string;
  image?: string | null;
  name: string;
  status?: UserStatus;
};

export function AgentAmirIdBadge({ email, image, name, status }: AgentAmirIdBadgeProps) {
  return (
    <section className="doshab-agent-amir-classified app-card relative overflow-hidden p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <AvatarInitials imageUrl={image} size="lg" value={name || email} />
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#f3d7a1]">
              Agent ID · Clearance: Black Belt
            </p>
            <h2 className="mt-2 truncate text-2xl font-bold text-white">
              {name || "Amir"}
            </h2>
            <p className="mt-1 truncate text-sm text-slate-300">{email}</p>
          </div>
        </div>

        <div className="grid gap-2 sm:text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-red-200/90">
            Mission Active
          </p>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span className="doshab-agent-amir-chip">Agent Status: Unpredictable</span>
            <span className="doshab-agent-amir-chip">Stealth Mode: Funny</span>
            <span className="doshab-agent-amir-chip">Risk Level: Amir</span>
            {status ? (
              <span className="doshab-agent-amir-chip">Signal: {status}</span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-white/10 pt-4 text-sm text-slate-200 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Access
          </p>
          <p className="mt-1 font-semibold text-white">Black Belt Protocol</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Clearance
          </p>
          <p className="mt-1 font-semibold text-white">Classified · Level 7</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Gadget
          </p>
          <p className="mt-1 font-semibold text-white">Scanline Button Mk.II</p>
        </div>
      </div>
    </section>
  );
}

