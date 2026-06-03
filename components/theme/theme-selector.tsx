"use client";

import type { CSSProperties } from "react";

import {
  DOSHAB_THEMES,
  getDoshabTheme,
  type DoshabThemeConfig,
} from "@/lib/themes";
import { useDoshabTheme } from "@/components/theme/use-doshab-theme";

export function ThemeSelector() {
  const { setThemeId, themeId } = useDoshabTheme();
  const activeTheme = getDoshabTheme(themeId);

  return (
    <section className="app-row overflow-hidden p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="app-section-title">Themes</p>
          <h3 className="mt-2 text-lg font-bold text-white">Choose your Doshab style</h3>
        </div>
        <span className="app-badge w-fit px-3 py-1 text-xs font-semibold">
          Active: {activeTheme.shortName}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {DOSHAB_THEMES.map((theme) => {
          const active = theme.id === themeId;

          return (
            <button
              aria-label={
                active
                  ? `${theme.shortName} is the current theme`
                  : `Use ${theme.shortName} theme`
              }
              aria-pressed={active}
              className={`theme-choice-card app-card grid min-h-56 gap-3 p-3 text-left transition hover:border-[#FF5F25]/55 ${
                active ? "theme-choice-card-active" : ""
              } ${theme.id === "agent-amir" ? "theme-choice-card-agent-amir" : ""} ${
                theme.id === "nima-last-light" ? "theme-choice-card-nima-last-light" : ""
              } ${theme.id === "araz-credit-empire" ? "theme-choice-card-araz-credit-empire" : ""
              } ${
                theme.id === "threez-street-hero" ? "theme-choice-card-threez-street-hero" : ""
              } ${
                theme.id === "hamp-root-forge" ? "theme-choice-card-hamp-root-forge" : ""
              } ${
                theme.id === "mehran-blue-corner" ? "theme-choice-card-mehran-blue-corner" : ""
              }`}
              key={theme.id}
              onClick={() => setThemeId(theme.id)}
              type="button"
            >
              <ThemeCardPreview theme={theme} />
              <span className="flex min-w-0 items-center justify-between gap-3">
                <span className="truncate text-lg font-bold text-white">{theme.shortName}</span>
                {active ? (
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#FF5F25]/50 bg-[#FF5F25]/15 text-[#FFB199]">
                    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.4" viewBox="0 0 24 24">
                      <path d="m5 12 4 4L19 6" />
                    </svg>
                  </span>
                ) : null}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ThemeCardPreview({ theme }: { theme: DoshabThemeConfig }) {
  return (
    <span
      aria-hidden="true"
      className="relative block h-40 overflow-hidden rounded-lg border"
      style={{
        "--theme-card-accent": theme.colors.accent,
        "--theme-card-accent-secondary": theme.colors.accentSecondary,
        "--theme-card-background": theme.backgroundStyle,
        "--theme-card-border": theme.colors.border,
        "--theme-card-button": theme.buttonStyle,
        "--theme-card-surface": theme.cardStyle,
        "--theme-card-text": theme.colors.text,
        background: "var(--theme-card-background)",
        borderColor: "var(--theme-card-border)",
        color: "var(--theme-card-text)",
      } as CSSProperties}
    >
      <span className="absolute inset-0 opacity-95" />
      <span className="absolute left-3 right-3 top-3 flex gap-1.5">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: theme.colors.accent }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: theme.colors.accentSecondary }} />
        <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
      </span>
      <span
        className="absolute left-4 right-4 top-10 h-20 rounded-lg border p-3"
        style={{
          background: "var(--theme-card-surface)",
          borderColor: "var(--theme-card-border)",
        }}
      >
        <span className="block h-3 w-2/3 rounded-full bg-current opacity-80" />
        <span className="mt-3 block h-2 w-full rounded-full bg-current opacity-25" />
        <span className="mt-2 block h-2 w-3/5 rounded-full bg-current opacity-20" />
      </span>
      <span
        className="absolute bottom-4 left-4 h-8 w-24 rounded-lg"
        style={{ background: "var(--theme-card-button)" }}
      />
      <span
        className="absolute bottom-5 right-5 h-6 w-6 rounded-full"
        style={{ background: theme.colors.accentSecondary }}
      />
    </span>
  );
}
