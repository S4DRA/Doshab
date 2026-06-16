import { BrandLoader } from "@/components/ui/loading-states";

export default function ProfileLoading() {
  return (
    <main className="loading-canvas app-page-scroll text-[color:var(--text-high)]" aria-busy="true">
      <div className="app-page-container grid gap-5 py-4">
        <section className="grid justify-items-center py-2">
          <BrandLoader label="Loading settings" size="sm" />
        </section>

        <section className="app-page-header">
          <div className="app-skeleton h-3 w-28 rounded-full" />
          <div className="app-skeleton mt-3 h-8 w-64 rounded-full" />
          <div className="app-skeleton mt-3 h-3 w-full max-w-2xl rounded-full" />
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
          <section className="app-panel p-5">
            <div className="app-card p-5">
              <div className="flex items-center gap-4">
                <div className="app-skeleton h-16 w-16 rounded-full" />
                <div className="min-w-0 flex-1">
                  <div className="app-skeleton h-3 w-20 rounded-full" />
                  <div className="app-skeleton mt-3 h-7 w-40 rounded-full" />
                  <div className="app-skeleton mt-2 h-3 w-48 rounded-full" />
                </div>
              </div>
              <div className="mt-8 grid gap-4">
                <div className="app-skeleton h-12 rounded-lg" />
                <div className="app-skeleton h-12 rounded-lg" />
                <div className="app-skeleton h-28 rounded-lg" />
                <div className="app-skeleton h-12 rounded-lg" />
              </div>
            </div>
          </section>

          <section className="app-panel p-5">
            <div className="app-skeleton h-3 w-24 rounded-full" />
            <div className="app-skeleton mt-3 h-8 w-44 rounded-full" />
            <div className="mt-5 flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <div className="app-skeleton h-10 w-28 rounded-full" key={index} />
              ))}
            </div>
            <div className="mt-5 grid gap-3">
              <div className="app-skeleton h-32 rounded-xl" />
              <div className="app-skeleton h-20 rounded-xl" />
              <div className="app-skeleton h-20 rounded-xl" />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
