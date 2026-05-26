import Image from "next/image";
import { ButtonLink } from "@/components/ui/button-link";

const features = [
  {
    title: "Custom profiles",
    description: "Upload your avatar, set your status, and personalize your presence.",
  },
  {
    title: "Live rooms",
    description: "Create instant voice and video spaces for friends, teams, or events.",
  },
  {
    title: "Private groups",
    description: "Keep conversations secure with invite-only communities.",
  },
  {
    title: "Fast setup",
    description: "Launch a new space and invite members in just a few clicks.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#070a12] text-slate-100">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.24),transparent_62%)]" />
      <section className="mx-auto grid w-full max-w-6xl gap-12 px-5 pb-16 pt-28 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-24">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
            Build calm spaces for friends
          </p>
          <h1 className="mt-5 max-w-3xl text-5xl font-bold leading-tight text-white sm:text-6xl">
            Doshab brings private voice and chat communities together.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            Doshab gives your group a clean, modern home base with polished profiles, secure spaces, and a fast path from setup to conversation.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <ButtonLink href="/dashboard">Open dashboard</ButtonLink>
            <ButtonLink href="/dashboard" variant="secondary">
              Start a group
            </ButtonLink>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-[#0d1322] p-5 shadow-2xl shadow-black/40">
          <div className="grid min-h-[360px] gap-4 rounded-3xl border border-white/8 bg-[#090d18] p-5 sm:grid-cols-[120px_1fr]">
            <div className="rounded-3xl bg-[#445242] p-4 shadow-inner shadow-black/20">
              <Image
                src="/doshab/Doshab_png.png"
                alt="Doshab brand mark"
                width={88}
                height={88}
                className="rounded-3xl object-cover"
              />
            </div>
            <div className="grid gap-4">
              <div className="relative overflow-hidden rounded-3xl bg-white/5">
                <Image
                  src="/doshab/InShot_20260526_123122377.jpg"
                  alt="Doshab inspiration"
                  width={640}
                  height={320}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 rounded-b-3xl bg-black/40 p-4 text-sm text-white">
                  A grounded space for every conversation.
                </div>
              </div>
              <div className="relative overflow-hidden rounded-3xl bg-white/5">
                <Image
                  src="/doshab/InShot_20260526_123220819.jpg"
                  alt="Doshab atmosphere"
                  width={640}
                  height={320}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-4 px-5 pb-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 shadow-sm shadow-black/10 transition hover:-translate-y-1 hover:border-[#FF5F25]/30"
          >
            <h2 className="text-base font-semibold text-white">{feature.title}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              {feature.description}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}
