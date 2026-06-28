"use client";

import Link from "next/link";
import { useEffect } from "react";

type DashboardErrorProps = {
  error: Error & { digest?: string };
  reset?: () => void;
  unstable_retry?: () => void;
};

export default function DashboardError({ error, reset, unstable_retry }: DashboardErrorProps) {
  useEffect(() => {
    console.error("Dashboard route failed", error);
  }, [error]);

  const retry = unstable_retry ?? reset;

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
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            className="app-button-primary h-11 rounded-xl px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!retry}
            onClick={retry}
            type="button"
          >
            Retry dashboard
          </button>
          <Link
            className="app-button-secondary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold transition"
            href="/dashboard"
          >
            Back to dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
