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
    <main className="min-h-screen overflow-hidden text-white">
      <section className="mx-auto grid w-full max-w-[1200px] gap-6 px-5 pb-14 pt-10 sm:px-8 lg:grid-cols-[1fr_0.86fr] lg:items-stretch lg:pb-16">
        <div className="flex min-h-[520px] flex-col justify-between rounded-[2rem] border border-white/15 bg-[#101010] p-6 sm:p-8 lg:p-9">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#FF5F25]">
              Private voice and chat
            </p>
            <h1 className="mt-6 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl">
              Calm communities, built in high contrast.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Doshab gives friends and small groups a focused home for private channels, live rooms, profiles, and invites without visual noise.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink href="/dashboard">Open dashboard</ButtonLink>
              <ButtonLink href="/register" variant="secondary">
                Create account
              </ButtonLink>
            </div>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#FF5F25]">Rooms</p>
              <p className="mt-3 text-2xl font-bold">Live</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#445242] p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-white/70">Groups</p>
              <p className="mt-3 text-2xl font-bold">Private</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#FF5F25]">Profiles</p>
              <p className="mt-3 text-2xl font-bold">Personal</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 rounded-[2rem] border border-white/15 bg-[#445242] p-4 sm:p-5">
          <div className="grid gap-4 rounded-[1.5rem] bg-black p-4 sm:grid-cols-[128px_1fr]">
            <div className="grid place-items-center rounded-[1.25rem] border border-white/10 bg-[#050505] p-4">
              <Image
                src="/Doshab_png.png"
                alt="Doshab brand mark"
                width={112}
                height={112}
                className="rounded-2xl object-cover"
              />
            </div>
            <div className="grid gap-4">
              <div className="relative min-h-56 overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#050505]">
                <Image
                  src="/InShot_20260526_123122377.jpg"
                  alt="Doshab inspiration"
                  width={640}
                  height={320}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-black/70 p-4 text-sm font-semibold text-white">
                  A grounded space for every conversation.
                </div>
              </div>
              <div className="relative min-h-56 overflow-hidden rounded-[1.25rem] border border-white/10 bg-[#050505]">
                <Image
                  src="/InShot_20260526_123220819.jpg"
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

      <section className="mx-auto grid w-full max-w-[1200px] gap-4 px-5 pb-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-4">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-[1.5rem] border border-white/15 bg-[#101010] p-6 transition hover:border-[#FF5F25]"
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
