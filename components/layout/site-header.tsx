import { LogoMark } from "@/components/ui/logo-mark";

export function SiteHeader() {
  return (
    <header className="pointer-events-none fixed left-3 top-3 z-50">
      <div className="pointer-events-auto flex items-center gap-3">
        <LogoMark className="h-14 w-14" />
        <div className="leading-tight">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#FF5F25]">
            Doshab
          </p>
          <p className="sr-only">Doshab calm communities</p>
        </div>
      </div>
    </header>
  );
}
