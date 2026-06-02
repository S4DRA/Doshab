import { ButtonLink } from "@/components/ui/button-link";
import { LogoMark } from "@/components/ui/logo-mark";

const stats = [
  ["Encrypted", "messages"],
  ["Realtime", "rooms"],
  ["Private", "spaces"],
];

const features = [
  {
    title: "Private by default",
    description: "Invite-only spaces, encrypted text channels, and focused permissions.",
  },
  {
    title: "Built for momentum",
    description: "Fast routing, optimistic chat, realtime updates, and low-friction rooms.",
  },
  {
    title: "People-first presence",
    description: "Profiles, status, voice rooms, and messages that feel alive without clutter.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden text-white">
      <section className="mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-[1240px] gap-5 px-5 py-5 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-stretch">
        <div className="app-surface flex min-h-[560px] flex-col justify-between rounded-xl p-6 sm:p-8 lg:p-10">
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <LogoMark className="h-20 w-20" />
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FF8A5F]">
                <span className="size-2 rounded-full bg-[#9CCF9A]" />
                Private voice and chat
              </div>
            </div>
            <h1 className="mt-8 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-tight text-white sm:text-6xl lg:text-7xl">
              A calm command center for your closest circles.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Doshab brings encrypted chat, live rooms, private spaces, and presence into one crisp workspace that feels fast the moment it opens.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/dashboard">Open dashboard</ButtonLink>
              <ButtonLink href="/register" variant="secondary">
                Create account
              </ButtonLink>
            </div>
          </div>

          <div className="mt-12 grid gap-3 sm:grid-cols-3">
            {stats.map(([value, label]) => (
              <div className="app-card p-4" key={value}>
                <p className="text-2xl font-semibold text-white">{value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid min-h-[560px] gap-5">
          <div className="app-surface grid overflow-hidden rounded-xl p-3">
            <div className="relative grid min-h-[340px] place-items-center overflow-hidden rounded-lg border border-white/10 bg-black">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,95,37,0.22),transparent_36%),radial-gradient(circle_at_68%_30%,rgba(156,207,154,0.14),transparent_30%)]" />
              <div className="absolute inset-x-12 top-10 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <LogoMark
                className="relative h-72 w-72 sm:h-96 sm:w-96"
                preload
                sizes="(max-width: 640px) 288px, 384px"
              />
              <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/70 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#FF8A5F]">
                      New mark
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      Rooted private spaces
                    </p>
                  </div>
                  <div className="rounded-full bg-[#FF5F25] px-3 py-1.5 text-xs font-bold text-black">
                    Doshab
                  </div>
                </div>
              </div>
            </div>
          </div>

          <section className="grid gap-3 sm:grid-cols-3">
            {features.map((feature) => (
              <article className="app-card p-4" key={feature.title}>
                <h2 className="text-sm font-semibold text-white">{feature.title}</h2>
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}
