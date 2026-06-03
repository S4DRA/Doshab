"use client";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#050705] px-4 py-8 pb-[calc(var(--dashboard-bottom-nav-height)+1rem)] text-white sm:pb-8 sm:pl-20">
      <section className="app-panel w-full max-w-lg p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          Something did not load
        </p>
        <h1 className="mt-3 text-2xl font-bold">Try opening the dashboard again</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The page hit a rendering problem before it finished. Retry now; if it
          keeps happening, the server logs will have the exact cause.
        </p>
        {error.digest ? (
          <p className="mt-3 rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-slate-400">
            Digest: {error.digest}
          </p>
        ) : null}
        <button
          className="app-button-primary mt-5 h-11 rounded-xl px-5 text-sm font-bold transition"
          onClick={reset}
          type="button"
        >
          Retry dashboard
        </button>
      </section>
    </main>
  );
}
