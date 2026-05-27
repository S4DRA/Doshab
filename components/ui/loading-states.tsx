import { LogoMark } from "@/components/ui/logo-mark";

type BrandLoaderProps = {
  label?: string;
  size?: "sm" | "lg";
};

export function BrandLoader({ label = "Loading", size = "lg" }: BrandLoaderProps) {
  return (
    <section
      aria-busy="true"
      aria-label={label}
      className="doshab-loader grid justify-items-center text-center"
    >
      <div
        className={`doshab-loader-orbit ${size === "sm" ? "doshab-loader-orbit-sm" : ""}`}
      >
        <span className="doshab-loader-ring" />
        <span className="doshab-loader-ring doshab-loader-ring-delay" />
        <span className="doshab-loader-pulse" />
        <LogoMark className="doshab-loader-logo" />
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
        {label}
      </p>
      <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
        <span className="doshab-loader-dot" />
        <span className="doshab-loader-dot" />
        <span className="doshab-loader-dot" />
      </div>
    </section>
  );
}

export function AppLoadingScreen({ label = "Loading" }: { label?: string }) {
  return (
    <main className="loading-canvas grid min-h-[100dvh] place-items-center px-4 text-white">
      <BrandLoader label={label} />
    </main>
  );
}

export function DashboardLoadingShell() {
  return (
    <main className="flex h-[100dvh] w-full overflow-hidden bg-[#050705] text-white">
      <aside className="hidden w-16 shrink-0 border-r border-white/10 bg-[#090c0a]/95 p-3 sm:flex sm:flex-col sm:items-center sm:gap-3">
        <div className="app-skeleton h-10 w-10 rounded-lg" />
        <div className="app-skeleton mt-4 h-10 w-10 rounded-lg" />
        <div className="app-skeleton h-10 w-10 rounded-lg" />
        <div className="app-skeleton h-10 w-10 rounded-lg" />
        <div className="mt-auto app-skeleton h-10 w-10 rounded-lg" />
      </aside>

      <aside className="dashboard-secondary-sidebar hidden w-[min(17rem,24vw)] shrink-0 flex-col border-r border-white/10 bg-[#0d100e] p-3 min-[1180px]:flex min-[1400px]:w-64 min-[1400px]:p-4">
        <div className="app-card p-4">
          <div className="app-skeleton h-3 w-16 rounded-full" />
          <div className="app-skeleton mt-3 h-5 w-36 rounded-full" />
          <div className="app-skeleton mt-3 h-3 w-full rounded-full" />
        </div>
        <div className="mt-5 grid gap-2">
          <div className="app-skeleton h-3 w-28 rounded-full" />
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="app-skeleton h-11 rounded-lg" key={index} />
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex min-h-12 items-center border-b border-white/10 bg-[#090c0a]/92 px-3 py-1.5 sm:px-5">
          <div className="min-w-0 flex-1">
            <div className="app-skeleton h-3 w-28 rounded-full" />
            <div className="app-skeleton mt-2 h-3 w-44 rounded-full" />
          </div>
          <div className="app-skeleton h-9 w-9 rounded-lg" />
        </header>

        <div className="grid min-h-0 flex-1 place-items-center px-4 py-6">
          <div className="grid w-full max-w-5xl gap-5">
            <BrandLoader label="Preparing dashboard" size="sm" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <section className="app-card p-4" key={index}>
                  <div className="app-skeleton h-4 w-24 rounded-full" />
                  <div className="app-skeleton mt-4 h-7 w-32 rounded-full" />
                  <div className="app-skeleton mt-4 h-3 w-full rounded-full" />
                  <div className="app-skeleton mt-2 h-3 w-4/5 rounded-full" />
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>

      <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 items-center gap-2 border-t border-white/10 bg-[#090c0a]/95 px-3 sm:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div className="app-skeleton h-10 w-10 rounded-lg" key={index} />
        ))}
      </nav>
    </main>
  );
}

export function VoiceRoomLoading() {
  return (
    <div className="grid min-h-0 flex-1 place-items-center px-5 py-8">
      <section className="app-panel grid w-full max-w-2xl justify-items-center p-6 text-center">
        <BrandLoader label="Opening voice room" size="sm" />
        <div className="mt-6 grid w-full gap-2">
          <div className="app-skeleton mx-auto h-3 w-44 rounded-full" />
          <div className="app-skeleton mx-auto h-3 w-32 rounded-full" />
        </div>
      </section>
    </div>
  );
}
