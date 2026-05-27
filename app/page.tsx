import Image from "next/image";

import { ButtonLink } from "@/components/ui/button-link";

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
            <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#FF8A5F]">
              <span className="size-2 rounded-full bg-[#9CCF9A]" />
              Private voice and chat
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
            <div className="relative min-h-[340px] overflow-hidden rounded-lg border border-white/10">
              <Image
                alt="Doshab private workspace"
                className="h-full w-full object-cover"
                height={720}
                priority
                src="/InShot_20260526_123122377.jpg"
                width={900}
              />
              <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-black/70 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-[#FF8A5F]">
                      Live room
                    </p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      Evening sync
                    </p>
                  </div>
                  <div className="rounded-full bg-[#FF5F25] px-3 py-1.5 text-xs font-bold text-black">
                    Active now
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
