import { ThemeToggle } from "@/components/ui/theme-toggle";

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#050609]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#445242] text-lg font-black text-white">
            D
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF5F25]">
              Doshab
            </p>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
              Calm communities
            </p>
          </div>
        </div>

        <ThemeToggle />
      </div>
    </header>
  );
}
