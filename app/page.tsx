import { SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button-link";

const features = [
  {
    title: "Groups",
    description: "Private spaces for friends, teams, and small communities.",
  },
  {
    title: "Chat",
    description: "A calm message timeline ready for realtime delivery later.",
  },
  {
    title: "Voice",
    description: "Persistent rooms for quick drop-in conversations.",
  },
  {
    title: "Video",
    description: "A future-ready place for face-to-face sessions.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070a12] text-slate-100">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.24),transparent_62%)]" />
      <div className="relative">
        <SiteHeader />

        <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-300">
              Private meeting spaces
            </p>
            <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-tight text-white sm:text-6xl">
              Palaver
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              A simple Discord-style home base for groups, channels, chat, and
              always-available voice or video rooms.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/dashboard">Open dashboard</ButtonLink>
              <ButtonLink href="/dashboard" variant="secondary">
                View foundation
              </ButtonLink>
            </div>
          </div>

          <div className="rounded-lg border border-white/10 bg-[#0d1322] p-4 shadow-2xl shadow-black/40">
            <div className="grid min-h-[360px] grid-cols-[64px_1fr] overflow-hidden rounded-md border border-white/8 bg-[#090d18]">
              <div className="flex flex-col items-center gap-3 border-r border-white/8 bg-[#0b1020] p-3">
                <span className="grid size-10 place-items-center rounded-md bg-indigo-500 text-sm font-black">
                  P
                </span>
                <span className="size-10 rounded-md bg-white/8" />
                <span className="size-10 rounded-md bg-white/8" />
              </div>
              <div className="grid grid-rows-[56px_1fr_72px]">
                <div className="border-b border-white/8 px-4 py-4">
                  <div className="h-3 w-32 rounded bg-white/20" />
                </div>
                <div className="space-y-4 p-4">
                  <div className="h-16 rounded-md bg-white/7" />
                  <div className="h-16 rounded-md bg-white/7" />
                  <div className="h-20 rounded-md border border-dashed border-white/12 bg-white/[0.03]" />
                </div>
                <div className="border-t border-white/8 p-4">
                  <div className="h-10 rounded-md bg-indigo-500/20" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 pb-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-lg border border-white/10 bg-white/[0.04] p-5"
            >
              <h2 className="text-base font-semibold text-white">{feature.title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {feature.description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
