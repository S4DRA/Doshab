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
    <main className="app-page-scroll bg-[#050705] text-white" aria-busy="true">
      <div className="app-page-container grid gap-4">
        <section className="app-page-header">
          <div className="app-skeleton h-3 w-20 rounded-full" />
          <div className="app-skeleton mt-3 h-8 w-48 rounded-full" />
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="app-card p-4" key={index}>
              <div className="app-skeleton h-4 w-24 rounded-full" />
              <div className="app-skeleton mt-4 h-7 w-32 rounded-full" />
              <div className="app-skeleton mt-4 h-3 w-full rounded-full" />
              <div className="app-skeleton mt-2 h-3 w-4/5 rounded-full" />
            </div>
          ))}
        </section>
      </div>
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
