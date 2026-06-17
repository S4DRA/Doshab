import Link from "next/link";

import { ThemeSelector } from "@/components/theme/theme-selector";

export default function ProfileThemesPage() {
  return (
    <main className="app-page-scroll bg-[#050705] text-slate-100">
      <div className="app-page-container grid gap-5">
        <section className="app-page-header">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="app-section-title">Theme settings</p>
              <h1 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
                Choose your VAL palette
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Pick from ten premium neo-brutalist palettes. Your dark or light
                preference stays global while the palette changes the full token set.
              </p>
            </div>
            <Link
              className="app-button-secondary inline-flex h-10 w-fit items-center rounded-lg px-4 text-sm font-bold transition"
              href="/dashboard/profile"
            >
              Back to settings
            </Link>
          </div>
        </section>

        <ThemeSelector />
      </div>
    </main>
  );
}
