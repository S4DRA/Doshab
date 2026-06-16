"use client";

import type { CSSProperties } from "react";

import { useDoshabTheme } from "@/components/theme/use-doshab-theme";
import {
  DOSHAB_THEMES,
  getDoshabTheme,
  type DoshabThemeConfig,
} from "@/lib/themes";

export function ThemeSelector() {
  const { setThemeId, themeId } = useDoshabTheme();
  const activeTheme = getDoshabTheme(themeId);

  return (
    <section className="theme-selector-shell app-panel overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="app-section-title">Appearance</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
            Dark or light, one VAL identity
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            VAL now ships with two focused high-contrast modes built around the same
            premium neo-brutalist system.
          </p>
        </div>
        <span className="app-badge w-fit px-3 py-1 text-xs font-semibold">
          Active: {activeTheme.name}
        </span>
      </div>

      <div className="theme-selector-grid mt-5 grid gap-4 lg:grid-cols-2">
        {DOSHAB_THEMES.map((theme) => {
          const active = theme.id === themeId;

          return (
            <button
              aria-pressed={active}
              className={`theme-choice-card flex min-w-0 flex-col gap-4 p-4 text-left transition ${
                active ? "theme-choice-card-active" : ""
              }`}
              key={theme.id}
              onClick={() => setThemeId(theme.id)}
              type="button"
            >
              <div className="theme-preview-viewport">
                <ThemePreview theme={theme} />
              </div>
              <div className="theme-choice-card-body flex min-w-0 flex-1 flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black text-white">{theme.name}</h4>
                  <span className="app-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                    {theme.shortName}
                  </span>
                  {active ? (
                    <span className="app-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                      Current
                    </span>
                  ) : null}
                </div>

                <p className="text-sm leading-6 text-slate-300">{theme.description}</p>

                <div className="theme-detail-grid mt-auto grid gap-2 sm:grid-cols-2">
                  {theme.previewDetails.map((detail) => (
                    <span className="theme-detail-pill" key={detail}>
                      {detail}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {theme.personality}
                  </span>
                  <span
                    className={`theme-select-button inline-flex h-11 items-center justify-center rounded-lg px-4 text-xs font-black uppercase tracking-[0.16em] transition ${
                      active ? "app-button-primary" : "app-button-secondary"
                    }`}
                  >
                    {active ? "Selected" : "Use mode"}
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function ThemePreview({ theme }: { theme: DoshabThemeConfig }) {
  return (
    <div
      className="theme-preview relative overflow-hidden rounded-lg border"
      style={
        {
          "--theme-preview-accent": theme.colors.accent,
          "--theme-preview-accent-secondary": theme.colors.accentSecondary,
          "--theme-preview-background": theme.backgroundStyle,
          "--theme-preview-border": theme.colors.border,
          "--theme-preview-button": theme.buttonStyle,
          "--theme-preview-card": theme.cardStyle,
          "--theme-preview-glow": theme.accentStyle,
          "--theme-preview-surface": theme.colors.surface,
          "--theme-preview-text": theme.colors.text,
        } as CSSProperties
      }
    >
      <div className="theme-preview-screen">
        <div className="theme-preview-header">
          <span />
          <span />
          <span />
        </div>
        <div className="grid gap-3 md:grid-cols-[0.36fr_1fr]">
          <div className="grid gap-2">
            <span className="theme-preview-chip">VAL</span>
            <span className="theme-preview-chip">CHAT</span>
            <span className="theme-preview-chip">VOICE</span>
          </div>
          <div className="theme-preview-card-surface">
            <div className="theme-preview-title" />
            <div className="theme-preview-line" />
            <div className="theme-preview-line theme-preview-line-short" />
            <div className="theme-preview-footer">
              <span className="theme-preview-button" />
              <span className="theme-preview-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
