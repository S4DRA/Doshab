export default function DashboardLoading() {
  return (
    <main className="flex h-[100dvh] w-full overflow-hidden bg-[#050705] text-white">
      <aside className="hidden w-64 shrink-0 border-r border-white/40 bg-[#0a0a0a] lg:block" />
      <section className="flex min-w-0 flex-1 flex-col">
        <header className="h-12 border-b border-white/40 bg-[#050505]" />
        <div className="grid flex-1 place-items-center p-4">
          <div className="flex items-center gap-3 rounded-2xl border border-white/30 bg-[#111111] px-4 py-3 text-sm font-semibold">
            <span className="size-2 rounded-full bg-[#FF5F25]" />
            Loading
          </div>
        </div>
      </section>
    </main>
  );
}
