import Link from "next/link";

import { ButtonLink } from "@/components/ui/button-link";

export function SiteHeader() {
  return (
    <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
      <Link href="/" className="flex items-center gap-3" aria-label="Palaver home">
        <span className="grid size-9 place-items-center rounded-md bg-indigo-500 text-sm font-black text-white">
          P
        </span>
        <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-200">
          Palaver
        </span>
      </Link>
      <ButtonLink href="/dashboard" variant="secondary" className="hidden sm:inline-flex">
        Open dashboard
      </ButtonLink>
    </header>
  );
}
