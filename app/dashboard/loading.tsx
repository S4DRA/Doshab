import { LogoMark } from "@/components/ui/logo-mark";

export default function DashboardLoading() {
  return (
    <main className="flex h-[100dvh] w-full overflow-hidden bg-[#050705] text-white">
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="h-12 border-b border-white/40 bg-[#050505]" />
        <div className="grid flex-1 place-items-center p-4">
          <section
            aria-label="Loading"
            className="doshab-loader rounded-3xl border border-white/30 bg-[#050505] px-8 py-7 text-center"
          >
            <div className="doshab-loader-mark mx-auto">
              <LogoMark className="doshab-loader-logo" />
              <span className="doshab-grape-piece" />
              <span className="doshab-grape-piece" />
              <span className="doshab-grape-piece" />
              <span className="doshab-grape-piece" />
              <span className="doshab-grape-piece" />
              <span className="doshab-grape-piece" />
              <span className="doshab-grape-piece" />
              <span className="doshab-grape-piece" />
            </div>
            <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
              Doshab
            </p>
            <p className="mt-2 text-sm font-semibold text-white">
              Pulling the space together
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
