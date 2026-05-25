import Link from "next/link";
import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footerText: string;
  footerHref: string;
  footerLinkText: string;
  error?: string;
  notice?: string;
};

export function AuthCard({
  title,
  subtitle,
  children,
  footerText,
  footerHref,
  footerLinkText,
  error,
  notice,
}: AuthCardProps) {
  return (
    <main className="grid min-h-screen place-items-center bg-[#070a12] px-5 py-10 text-slate-100">
      <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.2),transparent_62%)]" />
      <section className="relative w-full max-w-md rounded-lg border border-white/10 bg-[#0d1322] p-6 shadow-2xl shadow-black/40">
        <div className="mb-7">
          <Link href="/" className="mb-6 flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-indigo-500 text-sm font-black text-white">
              P
            </span>
            <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-200">
              Palaver
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-slate-400">{subtitle}</p>
        </div>

        {error ? (
          <p className="mb-5 rounded-md border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {notice ? (
          <p className="mb-5 rounded-md border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {notice}
          </p>
        ) : null}

        {children}

        <p className="mt-6 text-center text-sm text-slate-400">
          {footerText}{" "}
          <Link className="font-semibold text-indigo-300 hover:text-indigo-200" href={footerHref}>
            {footerLinkText}
          </Link>
        </p>
      </section>
    </main>
  );
}
