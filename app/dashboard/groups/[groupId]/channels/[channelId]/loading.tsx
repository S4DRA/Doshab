export default function ChannelLoading() {
  return (
    <main className="flex h-full min-h-0 w-full max-w-full overflow-hidden bg-[#070907]/95 text-slate-100 sm:h-auto sm:min-h-[100dvh] sm:overflow-visible min-[1180px]:h-[100dvh] min-[1180px]:min-h-0 min-[1180px]:overflow-hidden">
      <aside className="dashboard-secondary-sidebar hidden w-[292px] shrink-0 flex-col gap-3 border-r border-white/10 bg-[#0d100e] p-3 min-[1180px]:flex min-[1500px]:w-[312px]">
        <div className="app-card p-3.5">
          <div className="app-skeleton h-3 w-16 rounded-full" />
          <div className="app-skeleton mt-3 h-5 w-36 rounded-full" />
        </div>
        <div className="grid gap-2 py-2">
          <div className="app-skeleton h-3 w-28 rounded-full" />
          {Array.from({ length: 6 }).map((_, index) => (
            <div className="app-skeleton h-11 rounded-lg" key={index} />
          ))}
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden sm:overflow-visible min-[1180px]:overflow-hidden">
        <header className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 bg-[#090c0a]/92 px-3 py-2 backdrop-blur sm:px-6 min-[1180px]:min-h-16 min-[1180px]:px-7">
          <div className="min-w-0 flex-1">
            <div className="app-skeleton h-3 w-28 rounded-full" />
            <div className="app-skeleton mt-2 h-3 w-44 rounded-full" />
          </div>
          <div className="app-skeleton h-8 w-8 rounded-lg" />
        </header>

        <div className="flex min-h-0 flex-1 flex-col px-2.5 py-2.5 sm:px-4 sm:py-4 min-[1180px]:h-full min-[1180px]:px-7 min-[1180px]:py-5">
          <section className="app-surface shrink-0 rounded-xl p-3 sm:p-4 min-[1180px]:rounded-lg">
            <div className="app-skeleton h-3 w-24 rounded-full" />
            <div className="app-skeleton mt-3 h-7 w-52 rounded-full" />
          </section>
          <section className="app-panel mt-3 flex min-h-0 flex-1 flex-col p-3 sm:mt-4 sm:p-4">
            <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
              {Array.from({ length: 8 }).map((_, index) => (
                <div className="flex gap-3" key={index}>
                  <div className="app-skeleton h-9 w-9 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <div className="app-skeleton h-3 w-28 rounded-full" />
                    <div className="app-skeleton mt-2 h-3 w-full rounded-full" />
                    <div className="app-skeleton mt-2 h-3 w-3/5 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <div className="app-skeleton h-11 flex-1 rounded-lg" />
              <div className="app-skeleton h-11 w-20 rounded-lg" />
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
