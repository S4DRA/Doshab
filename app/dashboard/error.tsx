"use client";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function DashboardError({ error, reset }: DashboardErrorProps) {
  return (
    <main className="grid min-h-[100dvh] place-items-center bg-[#050705] px-4 pl-18 text-white sm:pl-20">
      <section className="w-full max-w-lg rounded-2xl border border-white/20 bg-[#111111] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF5F25]">
          Something stopped loading
        </p>
        <h1 className="mt-3 text-2xl font-bold">Dashboard needs a retry</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          The browser extension error can be ignored, but this page hit a server
          render problem. Try again, and check server logs if it keeps happening.
        </p>
        {error.digest ? (
          <p className="mt-3 rounded-xl border border-white/10 bg-black px-3 py-2 text-xs text-slate-400">
            Digest: {error.digest}
          </p>
        ) : null}
        <button
          className="mt-5 h-11 rounded-xl bg-[#FF5F25] px-5 text-sm font-bold text-black transition hover:bg-[#ff7847]"
          onClick={reset}
          type="button"
        >
          Retry
        </button>
      </section>
    </main>
  );
}
