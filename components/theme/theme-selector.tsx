"use client";

import type { CSSProperties } from "react";

import { useDoshabTheme } from "@/components/theme/use-doshab-theme";
import {
  DOSHAB_PALETTES,
  getDoshabThemeId,
  getDoshabTheme,
  type DoshabPaletteConfig,
  type DoshabThemeMode,
} from "@/lib/themes";

export function ThemeSelector() {
  const { mode, paletteId, setPaletteId, themeId } = useDoshabTheme();
  const activeTheme = getDoshabTheme(themeId);

  return (
    <section className="theme-selector-shell app-panel overflow-hidden p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <p className="app-section-title">Appearance</p>
          <h3 className="mt-2 text-xl font-black tracking-tight text-white sm:text-2xl">
            Ten VAL palettes, one disciplined system
          </h3>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Choose a bold neo-brutalist palette. The light and dark mode toggle keeps
            your selected palette and swaps the token set globally.
          </p>
        </div>
        <span className="app-badge w-fit px-3 py-1 text-xs font-semibold">
          Active: {activeTheme.name} / {activeTheme.mode}
        </span>
      </div>

      <div className="theme-selector-grid mt-5 grid gap-4 lg:grid-cols-2">
        {DOSHAB_PALETTES.map((palette) => {
          const active = palette.id === paletteId;
          const previewTheme = getDoshabTheme(getDoshabThemeId(palette.id, mode));

          return (
            <button
              aria-pressed={active}
              className={`theme-choice-card flex min-w-0 flex-col gap-4 p-4 text-left transition ${
                active ? "theme-choice-card-active" : ""
              }`}
              key={palette.id}
              onClick={() => setPaletteId(palette.id)}
              type="button"
            >
              <div className="theme-preview-viewport">
                <ThemePreview mode={mode} palette={palette} />
              </div>
              <div className="theme-choice-card-body flex min-w-0 flex-1 flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-black text-white">{palette.name}</h4>
                  <span className="app-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                    {palette.shortName}
                  </span>
                  {active ? (
                    <span className="app-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em]">
                      Current
                    </span>
                  ) : null}
                </div>

                <p className="text-sm leading-6 text-slate-300">{palette.description}</p>

                <div className="theme-detail-grid mt-auto grid gap-2 sm:grid-cols-2">
                  {palette.previewDetails.map((detail) => (
                    <span className="theme-detail-pill" key={detail}>
                      {detail}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                    {palette.personality}
                  </span>
                  <span
                    className={`theme-select-button inline-flex h-11 items-center justify-center rounded-lg px-4 text-xs font-black uppercase tracking-[0.16em] transition ${
                      active ? "app-button-primary" : "app-button-secondary"
                    }`}
                  >
                    {active ? `${previewTheme.mode} selected` : "Use palette"}
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

function ThemePreview({
  mode,
  palette,
}: {
  mode: DoshabThemeMode;
  palette: DoshabPaletteConfig;
}) {
  const colors = palette.colors[mode];

  return (
    <div
      className="theme-preview relative overflow-hidden rounded-lg border"
      style={
        {
          "--theme-preview-accent": colors.accent,
          "--theme-preview-accent-secondary": colors.accentSecondary,
          "--theme-preview-accent-tertiary": colors.accentTertiary,
          "--theme-preview-background": colors.background,
          "--theme-preview-border": colors.border,
          "--theme-preview-button": colors.accent,
          "--theme-preview-card": colors.card,
          "--theme-preview-glow": `6px 6px 0 ${colors.shadow}`,
          "--theme-preview-surface": colors.surface,
          "--theme-preview-text": colors.text,
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
