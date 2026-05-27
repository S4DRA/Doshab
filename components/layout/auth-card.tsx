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
    <main className="grid min-h-[calc(100vh-6rem)] place-items-center px-5 py-10 text-white">
      <section className="app-surface grid w-full max-w-5xl overflow-hidden rounded-xl lg:grid-cols-[0.92fr_1.08fr]">
        <div className="hidden min-h-[560px] flex-col justify-between border-r border-white/10 bg-[#263324] p-8 text-white lg:flex">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
              Doshab
            </p>
            <h2 className="mt-4 max-w-sm text-4xl font-semibold leading-tight">
              Private rooms with the pace of a real app.
            </h2>
          </div>
          <div className="rounded-lg border border-white/15 bg-black/20 p-5">
            <p className="text-sm font-semibold text-white">Secure by default</p>
            <p className="mt-2 text-sm leading-6 text-white/75">
              Encrypted messages, private groups, and fast navigation keep the workspace focused.
            </p>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="mb-7">
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#FF5F25]">
              Doshab
            </Link>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
          </div>

          {error ? (
            <p className="mb-5 rounded-xl border border-[#FF5F25]/40 bg-[#FF5F25]/10 px-4 py-3 text-sm text-white">
              {error}
            </p>
          ) : null}

          {notice ? (
            <p className="mb-5 rounded-xl border border-[#445242] bg-[#445242]/40 px-4 py-3 text-sm text-white">
              {notice}
            </p>
          ) : null}

          {children}

          <p className="mt-6 text-center text-sm text-slate-400">
            {footerText}{" "}
            <Link className="font-semibold text-[#FF5F25] hover:text-[#ff7847]" href={footerHref}>
              {footerLinkText}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
