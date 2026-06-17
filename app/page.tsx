import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";
import { LogoMark } from "@/components/ui/logo-mark";
import { DOSHAB_PALETTES } from "@/lib/themes";

const showcaseCards = [
  {
    title: "Desktop dashboard",
    description:
      "Manage spaces, channels, friends, and conversations from one clean dashboard.",
    variant: "desktop",
  },
  {
    title: "Mobile chat",
    description: "Chat smoothly on mobile with a layout designed for small screens.",
    variant: "mobile",
  },
  {
    title: "Voice channels",
    description: "Join voice rooms instantly and see who is inside before joining.",
    variant: "voice",
  },
  {
    title: "Theme settings",
    description: "Switch between ten focused high-contrast palettes without losing the VAL identity.",
    variant: "themes",
  },
] as const;

const features = [
  {
    title: "Text Channels",
    description: "Keep conversations organized with dedicated channels for every topic.",
  },
  {
    title: "Voice Channels",
    description: "Jump into voice rooms instantly without extra steps.",
  },
  {
    title: "Friend System",
    description: "Add friends, manage requests, and invite people into your spaces.",
  },
  {
    title: "Space Invites",
    description: "Bring accepted friends into your spaces with simple invites.",
  },
  {
    title: "Notifications",
    description: "Get alerts for messages, calls, invites, and missed calls.",
  },
  {
    title: "Dark & Light Modes",
    description: "Pair any premium palette with designed dark and light modes.",
  },
];

const themeCards = DOSHAB_PALETTES.map((theme) => ({
  name: theme.name,
  mood: theme.description,
  colors: [
    theme.colors.dark.accent,
    theme.colors.dark.accentSecondary,
    theme.colors.light.surface,
  ],
}));

export default function Home() {
  return (
    <div className="landing-page min-h-screen overflow-hidden bg-[#05030b] text-white">
      <section className="landing-hero relative isolate min-h-screen overflow-hidden px-4 pb-16 pt-5 sm:px-8 lg:px-10">
        <div aria-hidden="true" className="landing-hero-scene" />
        <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between gap-4">
          <Link className="flex items-center gap-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#79d8ff]" href="/">
            <LogoMark className="h-12 w-12" preload sizes="48px" />
            <span className="text-lg font-black tracking-[0.04em] text-white">VAL</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Landing navigation">
            <Link
              className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-[#79d8ff] sm:inline-flex"
              href="#features"
            >
              Features
            </Link>
            <Link
              className="rounded-lg border border-white/15 bg-white/[0.05] px-3 py-2 text-sm font-semibold text-slate-100 transition hover:border-[#79d8ff]/60 hover:bg-white/[0.08] focus:outline-none focus:ring-2 focus:ring-[#79d8ff]"
              href="/login"
            >
              Login
            </Link>
          </nav>
        </header>

        <div className="relative z-10 mx-auto grid min-h-[calc(100vh-5rem)] w-full max-w-7xl items-center gap-10 py-12 lg:grid-cols-[0.86fr_1.14fr] lg:py-16">
          <div className="max-w-3xl">
            <p className="inline-flex min-h-9 items-center rounded-full border border-[#79d8ff]/24 bg-[#79d8ff]/8 px-3 text-xs font-bold uppercase tracking-[0.18em] text-[#aeeaff]">
              Private voice, chat, and worlds
            </p>
            <h1 className="mt-6 text-5xl font-black leading-[0.96] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your private world for voice, chat, and spaces.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              VAL is a modern communication platform for friends, communities, and
              teams - with instant voice rooms, organized text channels, friend invites,
              notifications, and focused theme palettes with designed dark and light modes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <ButtonLink className="h-12 px-6" href="/register">
                Get started
              </ButtonLink>
              <ButtonLink className="h-12 px-6" href="#features" variant="secondary">
                Explore features
              </ButtonLink>
            </div>
          </div>

          <div
            aria-label="VAL dashboard mockup showing spaces, channels, chat, voice, notifications, and the two-mode design system"
            className="landing-float relative"
            role="img"
          >
            <DashboardMockup size="hero" />
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 lg:px-10" aria-labelledby="showcase-title">
        <SectionIntro
          eyebrow="Platform image showcase"
          id="showcase-title"
          title="See VAL in action"
          text="Polished mockups show the current VAL experience across desktop, mobile, voice, and the two-mode visual system."
        />
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {showcaseCards.map((card) => (
            <article className="landing-card overflow-hidden p-3" key={card.title}>
              <ShowcaseMockup variant={card.variant} />
              <div className="p-2 pt-4">
                <h3 className="text-base font-bold text-white">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{card.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        className="landing-section mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 lg:px-10"
        id="features"
        aria-labelledby="features-title"
      >
        <SectionIntro
          eyebrow="Everything your space needs"
          id="features-title"
          title="A communication platform that feels personal"
          text="VAL keeps the core space workflow simple: create a space, organize channels, talk live, invite friends, and tune the interface with dark or light mode."
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article className="landing-card p-5" key={feature.title}>
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-[#79d8ff]/20 bg-[#79d8ff]/10 text-sm font-black text-[#aeeaff]">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 text-lg font-bold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 lg:px-10" aria-labelledby="themes-title">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
          <SectionIntro
            eyebrow="Dark and light modes"
            id="themes-title"
            title="One identity. Two premium modes."
            text="VAL now uses ten premium neo-brutalist palettes, each tuned for strong contrast, tactile surfaces, and clear light and dark mode hierarchy."
          />
          <div className="landing-theme-row grid auto-cols-[minmax(16rem,1fr)] grid-flow-col gap-4 overflow-x-auto pb-3 lg:grid-flow-row lg:grid-cols-2 lg:overflow-visible lg:pb-0">
            {themeCards.map((theme) => (
              <ThemeCard key={theme.name} theme={theme} />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-8 lg:grid-cols-2 lg:px-10" aria-labelledby="voice-title">
        <div className="self-center">
          <p className="landing-eyebrow">Voice and calls</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl" id="voice-title">
            Voice rooms that feel instant.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-8 text-slate-300">
            Click a voice channel and join directly. See who is already inside,
            accept incoming calls, and keep talking while moving through the platform.
          </p>
        </div>
        <VoiceMockup />
      </section>

      <section className="landing-section mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:px-10" aria-labelledby="notifications-title">
        <div className="landing-card p-5 sm:p-6">
          <p className="landing-eyebrow">Notifications and PWA</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl" id="notifications-title">
            Don&apos;t miss messages or calls.
          </h2>
          <p className="mt-5 text-base leading-8 text-slate-300">
            VAL can notify you about messages, invites, missed calls, and incoming
            calls. On mobile, install VAL from your browser for a more app-like
            experience.
          </p>
          <p className="mt-4 rounded-lg border border-[#d8b56a]/24 bg-[#d8b56a]/10 p-4 text-sm leading-6 text-[#f5dfab]">
            Supported browsers can show phone notifications when VAL is installed
            and notifications are enabled.
          </p>
        </div>
        <NotificationMockup />
      </section>

      <section className="landing-section mx-auto w-full max-w-7xl px-4 py-16 sm:px-8 lg:px-10" aria-labelledby="responsive-title">
        <SectionIntro
          eyebrow="Desktop and mobile"
          id="responsive-title"
          title="Made for desktop and mobile."
          text="Use VAL on your computer for full control, or install it on your phone for a smoother app-like experience."
        />
        <div className="mt-8 grid items-center gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <DashboardMockup size="wide" />
          <PhoneMockup />
        </div>
      </section>

      <section className="landing-section px-4 py-16 sm:px-8 lg:px-10">
        <div className="landing-cta mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 p-6 text-center sm:p-10">
          <LogoMark className="mx-auto h-16 w-16" sizes="64px" />
          <h2 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-6xl">
            Create your VAL space.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-300">
            Start a space, invite your friends, and build a communication space
            that feels like yours.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink className="h-12 px-6" href="/register">
              Get started
            </ButtonLink>
            <ButtonLink className="h-12 px-6" href="/login" variant="secondary">
              Login
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function SectionIntro({
  eyebrow,
  id,
  text,
  title,
}: {
  eyebrow: string;
  id: string;
  text: string;
  title: string;
}) {
  return (
    <div className="max-w-3xl">
      <p className="landing-eyebrow">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-5xl" id={id}>
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 text-slate-300">{text}</p>
    </div>
  );
}

function DashboardMockup({ size }: { size: "hero" | "wide" }) {
  return (
    <div className={`landing-dashboard-mockup ${size === "hero" ? "min-h-[30rem]" : "min-h-[24rem]"}`}>
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-[#ff6b6b]" />
          <span className="h-3 w-3 rounded-full bg-[#d8b56a]" />
          <span className="h-3 w-3 rounded-full bg-[#79d8ff]" />
        </div>
        <div className="flex items-center gap-3 text-xs font-semibold text-slate-400">
          <span>Team space</span>
          <span className="grid h-8 w-8 place-items-center rounded-lg border border-[#79d8ff]/20 bg-[#79d8ff]/10 text-[#aeeaff]">
            N
          </span>
        </div>
      </div>
      <div className="grid min-h-[inherit] grid-cols-[3.6rem_minmax(8rem,0.75fr)_minmax(0,1.8fr)]">
        <div className="border-r border-white/10 bg-black/24 p-3">
          <div className="grid gap-3">
            {["D", "A", "N", "3"].map((item, index) => (
              <span
                className={`grid h-10 w-10 place-items-center rounded-lg border text-xs font-black ${
                  index === 0
                    ? "border-[#79d8ff]/50 bg-[#79d8ff]/16 text-[#dff7ff]"
                    : "border-white/10 bg-white/[0.05] text-slate-300"
                }`}
                key={item}
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="hidden border-r border-white/10 bg-[#0b1020]/76 p-4 sm:block">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d8b56a]">Channels</p>
          <div className="mt-4 grid gap-2 text-sm text-slate-300">
            <span className="rounded-lg bg-white/[0.05] px-3 py-2"># planning</span>
            <span className="rounded-lg border border-[#79d8ff]/24 bg-[#79d8ff]/10 px-3 py-2 text-[#dff7ff]">
              # main-chat
            </span>
            <span className="rounded-lg bg-white/[0.05] px-3 py-2"># ideas</span>
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#d8b56a]">Voice</p>
          <div className="mt-3 rounded-lg border border-[#79d8ff]/24 bg-[#79d8ff]/10 p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white">Lounge</span>
              <span className="landing-voice-dot" />
            </div>
            <div className="mt-3 flex -space-x-2">
              {["S", "M", "A"].map((item) => (
                <span className="grid h-7 w-7 place-items-center rounded-lg border border-black/40 bg-[#16243c] text-[10px] font-bold text-white" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex min-w-0 flex-col p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#79d8ff]">main-chat</p>
              <h3 className="mt-1 text-xl font-black text-white">Tonight&apos;s plan</h3>
            </div>
            <span className="rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-bold text-slate-200">
              Bell
            </span>
          </div>
          <div className="mt-5 grid flex-1 content-start gap-3">
            <MessageBubble name="Mara" text="Voice room is open. Join when you are ready." />
            <MessageBubble
              delay
              name="Jules"
              text="Pinned the invite notes and dark/light preview updates."
            />
            <MessageBubble
              name="Omar"
              text="Light mode still feels crisp on mobile. Keep that contrast."
            />
          </div>
          <div className="mt-5 rounded-xl border border-[#d8b56a]/28 bg-[#d8b56a]/10 p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f5dfab]">Active call</p>
                <p className="mt-1 text-sm font-bold text-white">Lounge - 3 people inside</p>
              </div>
              <div className="flex gap-2">
                <span className="h-9 w-9 rounded-lg bg-[#79d8ff]/18" />
                <span className="h-9 w-9 rounded-lg bg-[#d8b56a]/18" />
                <span className="h-9 w-9 rounded-lg bg-white/10" />
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["Dark", "Light", "Focus"].map((item) => (
              <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2 py-2 text-center text-xs font-bold text-slate-300" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ delay = false, name, text }: { delay?: boolean; name: string; text: string }) {
  return (
    <div className={`landing-message-bubble ${delay ? "landing-message-bubble-delay" : ""}`}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#202947] text-xs font-black text-[#aeeaff]">
        {name[0]}
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-bold text-white">{name}</span>
        <span className="mt-1 block text-sm leading-5 text-slate-300">{text}</span>
      </span>
    </div>
  );
}

function ShowcaseMockup({ variant }: { variant: (typeof showcaseCards)[number]["variant"] }) {
  if (variant === "mobile") {
    return <PhoneMockup compact />;
  }

  if (variant === "voice") {
    return <VoiceMockup compact />;
  }

  if (variant === "themes") {
    return (
      <div className="grid min-h-56 gap-3 rounded-xl border border-white/10 bg-[#070a14] p-4">
        {themeCards.slice(0, 4).map((theme) => (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-2" key={theme.name}>
            <span
              className="h-9 w-9 rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${theme.colors[0]}, ${theme.colors[1]})`,
              }}
            />
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold text-white">{theme.name}</span>
              <span className="block truncate text-[11px] text-slate-500">{theme.mood}</span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-56 overflow-hidden rounded-xl border border-white/10 bg-[#070a14]">
      <DashboardMockup size="wide" />
    </div>
  );
}

function ThemeCard({
  theme,
}: {
  theme: {
    colors: string[];
    mood: string;
    name: string;
  };
}) {
  return (
    <article className="landing-card landing-theme-card min-h-60 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-black text-white">{theme.name}</h3>
        <div className="flex gap-1.5">
          {theme.colors.map((color) => (
            <span className="h-3 w-3 rounded-full border border-white/20" key={color} style={{ background: color }} />
          ))}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-400">{theme.mood}</p>
      <div
        className="mt-5 rounded-xl border border-white/10 p-3"
        style={{
          background: `linear-gradient(135deg, ${theme.colors[2]}, rgba(255, 255, 255, 0.08))`,
        }}
      >
        <div className="flex items-center gap-2">
          <span className="h-9 w-9 rounded-lg" style={{ background: theme.colors[0] }} />
          <div className="h-2 flex-1 rounded-full bg-white/18" />
        </div>
        <div className="mt-4 grid gap-2">
          <div className="h-8 rounded-lg bg-white/10" />
          <div className="h-8 w-4/5 rounded-lg bg-white/10" />
          <div className="h-8 w-2/3 rounded-lg" style={{ background: `${theme.colors[1]}33` }} />
        </div>
      </div>
    </article>
  );
}

function VoiceMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`landing-card ${compact ? "min-h-56 p-4" : "p-5 sm:p-6"}`}>
      <div className="rounded-xl border border-[#79d8ff]/20 bg-[#07101e] p-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#79d8ff]">Voice channels</p>
        <div className="mt-4 grid gap-3">
          {["Focus room", "Lounge", "Late night call"].map((room, index) => (
            <div className={`rounded-lg border p-3 ${index === 1 ? "border-[#79d8ff]/36 bg-[#79d8ff]/10" : "border-white/10 bg-white/[0.04]"}`} key={room}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold text-white">{room}</span>
                {index === 1 ? <span className="landing-voice-dot" /> : null}
              </div>
              {index === 1 ? (
                <div className="mt-3 flex -space-x-2">
                  {["A", "M", "H", "N"].map((item) => (
                    <span className="grid h-8 w-8 place-items-center rounded-lg border border-black/40 bg-[#17233d] text-[11px] font-black text-white" key={item}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-[#d8b56a]/24 bg-[#d8b56a]/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#f5dfab]">Incoming call</p>
            <p className="mt-1 text-sm font-bold text-white">Private call on VAL</p>
          </div>
          <div className="flex gap-2">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#79d8ff] text-xs font-black text-[#04111d]">Join</span>
            <span className="h-10 w-10 rounded-lg bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}

function NotificationMockup() {
  return (
    <div className="landing-card grid content-center gap-4 p-5 sm:p-6">
      {[
        ["Message", "Jules sent a message in #main-chat"],
        ["Invite", "Mara invited you to Mission Room"],
        ["Missed call", "You missed a private VAL call"],
      ].map(([label, text]) => (
        <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4" key={label}>
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#79d8ff]/14 text-xs font-black text-[#aeeaff]">
              {label.slice(0, 2).toUpperCase()}
            </span>
            <span>
              <span className="block text-sm font-bold text-white">{label}</span>
              <span className="mt-1 block text-sm leading-6 text-slate-400">{text}</span>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function PhoneMockup({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`mx-auto w-full max-w-[22rem] rounded-[2rem] border border-white/12 bg-[#05070d] p-3 shadow-2xl shadow-black/40 ${compact ? "max-w-[16rem]" : ""}`}>
      <div className="min-h-[30rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#090d19]">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#79d8ff]">Mobile chat</span>
          <span className="h-8 w-8 rounded-lg bg-[#d8b56a]/20" />
        </div>
        <div className="grid gap-3 p-4">
          <MessageBubble name="M" text="Are we joining voice?" />
          <MessageBubble delay name="S" text="Yes, Lounge is already active." />
          <div className="rounded-xl border border-[#79d8ff]/24 bg-[#79d8ff]/10 p-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#aeeaff]">Voice room</p>
            <p className="mt-1 text-sm font-bold text-white">Lounge - 4 inside</p>
          </div>
          <div className="mt-4 grid grid-cols-5 gap-2 rounded-2xl border border-white/10 bg-black/30 p-2">
            {["F", "+", "#", "B", "P"].map((item) => (
              <span className="grid h-10 place-items-center rounded-xl bg-white/[0.06] text-xs font-black text-slate-300" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
