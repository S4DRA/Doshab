"use client";

import type { CSSProperties } from "react";

import {
  DOSHAB_THEMES,
  getDoshabTheme,
  type DoshabThemeConfig,
  type DoshabThemeIconId,
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
          Active: {activeTheme.name}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {DOSHAB_THEMES.map((theme) => {
          const active = theme.id === themeId;

          return (
            <article
              className={`theme-choice-card app-card flex min-w-0 flex-col gap-4 p-4 transition ${
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
            >
              <ThemePreview theme={theme} />
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-lg font-bold text-white">{theme.name}</h4>
                    <span className="app-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                      {theme.shortName}
                    </span>
                    {active ? (
                      <span className="app-badge px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em]">
                        Current
                      </span>
                    ) : null}
                  </div>
                </div>
                {theme.themeIcons ? (
                  <div className="theme-icon-strip flex flex-wrap gap-1.5">
                    {theme.themeIcons.map((icon) => (
                      <span className="theme-icon-token" key={icon.id} title={icon.label}>
                        <ThemeIcon className="h-5 w-5" id={icon.id} />
                        <span className="sr-only">{icon.label}</span>
                      </span>
                    ))}
                  </div>
                ) : null}
                <button
                  aria-label={
                    active ? `${theme.name} is the current theme` : `Use ${theme.name} theme`
                  }
                  aria-pressed={active}
                  className={`mt-auto h-11 w-full rounded-lg px-3 text-xs font-bold transition ${
                    active ? "app-button-primary" : "app-button-secondary"
                  }`}
                  onClick={() => setThemeId(theme.id)}
                  title={active ? "Current theme" : `Use ${theme.name}`}
                  type="button"
                >
                  {active ? "Selected" : "Use theme"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ThemePreview({ theme }: { theme: DoshabThemeConfig }) {
  if (theme.id === "agent-amir") {
    return <AgentAmirPreview theme={theme} />;
  }

  if (theme.id === "nima-last-light") {
    return <NimaLastLightPreview theme={theme} />;
  }

  if (theme.id === "araz-credit-empire") {
    return <ArazCreditEmpirePreview theme={theme} />;
  }

  if (theme.id === "threez-street-hero") {
    return <ThreezStreetHeroPreview theme={theme} />;
  }

  if (theme.id === "hamp-root-forge") {
    return <HampRootForgePreview theme={theme} />;
  }

  if (theme.id === "mehran-blue-corner") {
    return <MehranBlueCornerPreview theme={theme} />;
  }

  return (
    <div
      className={`theme-preview relative overflow-hidden rounded-lg border ${
        theme.decorativeClassName ?? ""
      }`}
      style={{
        "--theme-preview-accent": theme.colors.accent,
        "--theme-preview-accent-secondary": theme.colors.accentSecondary,
        "--theme-preview-background": theme.backgroundStyle,
        "--theme-preview-border": theme.colors.border,
        "--theme-preview-button": theme.buttonStyle,
        "--theme-preview-card": theme.cardStyle,
        "--theme-preview-glow": theme.accentStyle,
        "--theme-preview-surface": theme.colors.surface,
        "--theme-preview-text": theme.colors.text,
      } as CSSProperties}
    >
      <div className="theme-preview-screen">
        <div className="theme-preview-header">
          <span />
          <span />
          <span />
        </div>
        <div className="theme-preview-card-surface">
          <div className="theme-preview-title" />
          <div className="theme-preview-line" />
          <div className="theme-preview-line theme-preview-line-short" />
        </div>
        <div className="theme-preview-footer">
          <span className="theme-preview-button" />
          <span className="theme-preview-pulse" />
        </div>
      </div>
    </div>
  );
}

function AgentAmirPreview({ theme }: { theme: DoshabThemeConfig }) {
  return (
    <div
      className={`theme-preview theme-preview-agent-amir-rich relative overflow-hidden rounded-lg border ${
        theme.decorativeClassName ?? ""
      }`}
      style={{
        "--theme-preview-accent": theme.colors.accent,
        "--theme-preview-accent-secondary": theme.colors.accentSecondary,
        "--theme-preview-background": theme.backgroundStyle,
        "--theme-preview-border": theme.colors.border,
        "--theme-preview-button": theme.buttonStyle,
        "--theme-preview-card": theme.cardStyle,
        "--theme-preview-glow": theme.accentStyle,
        "--theme-preview-surface": theme.colors.surface,
        "--theme-preview-text": theme.colors.text,
      } as CSSProperties}
    >
      <div className="amir-preview-radar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="amir-preview-fingerprint" aria-hidden="true">
        <ThemeIcon className="h-7 w-7" id="fingerprint" />
      </div>
      <div className="amir-preview-file">
        <div className="amir-preview-file-top">
          <span className="amir-preview-red-dot" />
          <span>[ Mission Active ]</span>
          <strong>Clearance Verified</strong>
        </div>
        <h5>Agent Amir</h5>
        <div aria-hidden="true" className="amir-preview-grid">
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="black-belt" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="stealth-mask" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="id-badge" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="alert-triangle" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
        </div>
        <div className="amir-preview-footer">
          <button type="button">Gold Access</button>
          <span className="amir-preview-alert">Red flag: joke pending</span>
        </div>
      </div>
    </div>
  );
}

function NimaLastLightPreview({ theme }: { theme: DoshabThemeConfig }) {
  return (
    <div
      className={`theme-preview theme-preview-nima-rich relative overflow-hidden rounded-lg border ${
        theme.decorativeClassName ?? ""
      }`}
      style={{
        "--theme-preview-accent": theme.colors.accent,
        "--theme-preview-accent-secondary": theme.colors.accentSecondary,
        "--theme-preview-background": theme.backgroundStyle,
        "--theme-preview-border": theme.colors.border,
        "--theme-preview-button": theme.buttonStyle,
        "--theme-preview-card": theme.cardStyle,
        "--theme-preview-glow": theme.accentStyle,
        "--theme-preview-surface": theme.colors.surface,
        "--theme-preview-text": theme.colors.text,
      } as CSSProperties}
    >
      <div className="nima-preview-ruins" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="nima-preview-panel">
        <div className="nima-preview-kicker">
          <ThemeIcon className="h-3.5 w-3.5" id="moss-leaf" />
          Survival Mode
        </div>
        <h5>Nima: Last Light</h5>
        <div aria-hidden="true" className="nima-preview-status-list">
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="trust-level" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="survival-compass" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="skull-marker" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="backpack" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="emotion-filter" />
            <i className="theme-preview-mini-bar" />
          </span>
        </div>
        <div className="nima-preview-actions">
          <button type="button">
            <ThemeIcon className="h-3.5 w-3.5" id="camp" />
            Active
          </button>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="alert-triangle" />
            Risk: High
          </span>
        </div>
      </div>
    </div>
  );
}

function ArazCreditEmpirePreview({ theme }: { theme: DoshabThemeConfig }) {
  return (
    <div
      className={`theme-preview araz-preview-rich relative overflow-hidden rounded-lg border ${
        theme.decorativeClassName ?? ""
      }`}
      style={{
        "--theme-preview-accent": theme.colors.accent,
        "--theme-preview-accent-secondary": theme.colors.accentSecondary,
        "--theme-preview-background": theme.backgroundStyle,
        "--theme-preview-border": theme.colors.border,
        "--theme-preview-button": theme.buttonStyle,
        "--theme-preview-card": theme.cardStyle,
        "--theme-preview-glow": theme.accentStyle,
        "--theme-preview-surface": theme.colors.surface,
        "--theme-preview-text": theme.colors.text,
      } as CSSProperties}
    >
      <div className="araz-preview-orbit" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="araz-preview-command" aria-hidden="true">
        <ThemeIcon className="h-8 w-8" id="empire-tower" />
      </div>
      <div className="araz-preview-panel">
        <div className="araz-preview-kicker">
          <ThemeIcon className="h-3.5 w-3.5" id="credit-coin" />
          Grind Mode Active
        </div>
        <h5>Araz: Credit Empire</h5>
        <div aria-hidden="true" className="araz-preview-status-list">
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="wallet" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="empire-tower" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="spending-alert" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="profit-arrow" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
        </div>
        <div className="araz-preview-chart" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="araz-preview-finance-row">
          <span>
            Credits <strong>8.45M</strong>
          </span>
          <span>
            Risk <b>High</b>
          </span>
          <span>
            CR <em>+23.8%</em>
          </span>
        </div>
        <div className="araz-preview-actions">
          <button type="button">Active</button>
          <span>View Details</span>
        </div>
        <div className="araz-preview-warning">
          <ThemeIcon className="h-3.5 w-3.5" id="alert-triangle" />
          Overspending today. Rich tomorrow.
        </div>
      </div>
    </div>
  );
}

function ThreezStreetHeroPreview({ theme }: { theme: DoshabThemeConfig }) {
  return (
    <div
      className={`theme-preview theme-preview-threez-rich relative overflow-hidden rounded-lg border ${
        theme.decorativeClassName ?? ""
      }`}
      style={{
        "--theme-preview-accent": theme.colors.accent,
        "--theme-preview-accent-secondary": theme.colors.accentSecondary,
        "--theme-preview-background": theme.backgroundStyle,
        "--theme-preview-border": theme.colors.border,
        "--theme-preview-button": theme.buttonStyle,
        "--theme-preview-card": theme.cardStyle,
        "--theme-preview-glow": theme.accentStyle,
        "--theme-preview-surface": theme.colors.surface,
        "--theme-preview-text": theme.colors.text,
      } as CSSProperties}
    >
      <div className="threez-preview-motion" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="threez-preview-shoe" aria-hidden="true">
        <ThemeIcon className="h-16 w-16" id="sneaker" />
      </div>
      <div className="threez-preview-panel">
        <div className="threez-preview-title-row">
          <span className="threez-preview-logo">3z</span>
          <div className="min-w-0">
            <h5>3z: Street Hero</h5>
            <p>Campus Legend Mode</p>
          </div>
          <ThemeIcon className="h-5 w-5" id="lightning-bolt" />
        </div>
        <div className="threez-preview-tag-row">
          <span className="threez-preview-tag">
            <ThemeIcon className="h-3.5 w-3.5" id="cap" />
            Hat tag
          </span>
          <span className="threez-preview-tag threez-preview-sneaker-tag">
            <ThemeIcon className="h-3.5 w-3.5" id="sneaker" />
            Sneaker-tag: clean
          </span>
        </div>
        <div aria-hidden="true" className="threez-preview-status-list">
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="hero-shield" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="sneaker" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="mind-map-nodes" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="style-badge" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="brain-psychology" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="campus-legend-badge" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
        </div>
        <div className="threez-preview-mind-map" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
          <ThemeIcon className="h-7 w-7" id="brain-psychology" />
        </div>
        <div className="threez-preview-actions">
          <button type="button">Active</button>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="comic-burst" />
            Brain Cell: Loading
          </span>
        </div>
      </div>
    </div>
  );
}

function HampRootForgePreview({ theme }: { theme: DoshabThemeConfig }) {
  return (
    <div
      className={`theme-preview theme-preview-hamp-rich relative overflow-hidden rounded-lg border ${
        theme.decorativeClassName ?? ""
      }`}
      style={{
        "--theme-preview-accent": theme.colors.accent,
        "--theme-preview-accent-secondary": theme.colors.accentSecondary,
        "--theme-preview-background": theme.backgroundStyle,
        "--theme-preview-border": theme.colors.border,
        "--theme-preview-button": theme.buttonStyle,
        "--theme-preview-card": theme.cardStyle,
        "--theme-preview-glow": theme.accentStyle,
        "--theme-preview-surface": theme.colors.surface,
        "--theme-preview-text": theme.colors.text,
      } as CSSProperties}
    >
      <div className="hamp-preview-founder" aria-hidden="true">
        <span className="hamp-preview-founder-core" />
      </div>
      <div className="hamp-preview-circuit" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="hamp-preview-panel">
        <div className="hamp-preview-title-row">
          <span className="hamp-preview-seal">
            <ThemeIcon className="h-4 w-4" id="system-core" />
          </span>
          <div className="min-w-0">
            <div className="hamp-preview-kicker">Founder Mode</div>
            <h5>Hamp: Root Forge</h5>
          </div>
        </div>
        <div aria-hidden="true" className="hamp-preview-status-list">
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="root-system" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="forge-build" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="ai-agent-network" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="command-node" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="protocol-lock" />
            <i className="theme-preview-mini-bar" />
          </span>
        </div>
        <div className="hamp-preview-terminal" aria-hidden="true">
          <span>root://system</span>
          <strong>operational</strong>
        </div>
        <button className="hamp-preview-console" type="button">
          Open Founder Console
        </button>
      </div>
    </div>
  );
}

function MehranBlueCornerPreview({ theme }: { theme: DoshabThemeConfig }) {
  return (
    <div
      className={`theme-preview mehran-preview-rich relative overflow-hidden rounded-lg border ${
        theme.decorativeClassName ?? ""
      }`}
      style={{
        "--theme-preview-accent": theme.colors.accent,
        "--theme-preview-accent-secondary": theme.colors.accentSecondary,
        "--theme-preview-background": theme.backgroundStyle,
        "--theme-preview-border": theme.colors.border,
        "--theme-preview-button": theme.buttonStyle,
        "--theme-preview-card": theme.cardStyle,
        "--theme-preview-glow": theme.accentStyle,
        "--theme-preview-surface": theme.colors.surface,
        "--theme-preview-text": theme.colors.text,
      } as CSSProperties}
    >
      <div className="mehran-preview-smoke" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="mehran-preview-ring" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <div className="mehran-preview-panel">
        <div className="mehran-preview-title-row">
          <span className="mehran-preview-mark">M</span>
          <div className="min-w-0">
            <h5>Mehran: Blue Corner</h5>
            <p>Silent Mode - Blue Corner</p>
          </div>
          <ThemeIcon className="h-5 w-5" id="blue-corner-marker" />
        </div>
        <div aria-hidden="true" className="mehran-preview-status-list">
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="focus-heartbeat" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="silent-mode" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="mma-glove" />
            <i className="theme-preview-mini-bar" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="guard-shield" />
            <i className="theme-preview-mini-bar theme-preview-mini-bar-short" />
          </span>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="corner-stool" />
            <i className="theme-preview-mini-bar" />
          </span>
        </div>
        <div className="mehran-preview-actions">
          <button type="button">Active</button>
          <span>
            <ThemeIcon className="h-3.5 w-3.5" id="fight-card" />
            Fight-card: locked
          </span>
        </div>
      </div>
      <aside className="mehran-preview-corner-panel">
        <ThemeIcon className="h-8 w-8" id="boxing-glove" />
        <span>Blue Corner</span>
        <strong>Threat Quiet</strong>
      </aside>
    </div>
  );
}

function ThemeIcon({
  className,
  id,
}: {
  className?: string;
  id: DoshabThemeIconId;
}) {
  const iconClassName = `theme-system-icon ${className ?? ""}`;

  switch (id) {
    case "mission-target":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7" />
          <circle cx="12" cy="12" r="2.4" />
          <path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4" />
        </svg>
      );
    case "radar":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 19a10 10 0 1 1 15 0" />
          <path d="M8 19a6 6 0 1 1 8 0" />
          <path d="M12 19V5l7 8" />
          <circle cx="12" cy="19" r="1.5" />
        </svg>
      );
    case "shield":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3 5 5.8v5.6c0 4.2 2.8 7.2 7 8.6 4.2-1.4 7-4.4 7-8.6V5.8L12 3Z" />
          <path d="m9 12 2 2 4-5" />
        </svg>
      );
    case "fingerprint":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" viewBox="0 0 24 24">
          <path d="M7.2 15.4c.4-2.5.2-6.4 4.8-6.4 4.4 0 4.8 3.3 4.8 4.9" />
          <path d="M9.2 19.2c1.1-2.1 1.2-4.2 1.2-6.2 0-.8.6-1.6 1.6-1.6 1.1 0 1.6.8 1.6 1.6 0 2.4-.2 4.8-1.1 6.8" />
          <path d="M5 12.4c.1-4 2.8-7 7-7 4.1 0 7 2.8 7 7" />
          <path d="M4.6 16.8c.5-1.4.7-2.8.7-4.6" />
          <path d="M16.5 19c.4-1.4.6-3.2.6-5.2" />
          <path d="M8.2 3.8A8.8 8.8 0 0 1 12 3c5.2 0 9 3.8 9 8.8" />
        </svg>
      );
    case "lock":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="5" y="10" width="14" height="10" rx="2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          <path d="M12 14v2" />
        </svg>
      );
    case "surveillance-eye":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
          <circle cx="12" cy="12" r="2.6" />
          <path d="M12 3v2M12 19v2" />
        </svg>
      );
    case "alert-triangle":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3 21 20H3L12 3Z" />
          <path d="M12 9v5M12 17h.01" />
        </svg>
      );
    case "id-badge":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M8 4h8l1 3H7l1-3Z" />
          <rect x="5" y="7" width="14" height="15" rx="2" />
          <circle cx="12" cy="13" r="2" />
          <path d="M8.5 19c.7-1.5 2-2.2 3.5-2.2s2.8.7 3.5 2.2" />
        </svg>
      );
    case "black-belt":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M3 10c3.2-1.4 6.2-1.4 9 0 2.8 1.4 5.8 1.4 9 0" />
          <path d="M3 14c3.2-1.4 6.2-1.4 9 0 2.8 1.4 5.8 1.4 9 0" />
          <path d="m9.5 9 3 6M14.5 9l-3 6" />
          <path d="M10 12h4" />
        </svg>
      );
    case "briefcase":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7" />
          <rect x="4" y="7" width="16" height="13" rx="2" />
          <path d="M4 12h16M10 12v2h4v-2" />
        </svg>
      );
    case "stealth-mask":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 12c2.2-3 4.8-4.5 8-4.5S17.8 9 20 12c-2.2 3-4.8 4.5-8 4.5S6.2 15 4 12Z" />
          <path d="M8 12h3M13 12h3" />
          <path d="M10 15.5 12 17l2-1.5" />
        </svg>
      );
    case "encrypted-channel":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 8h4l2-3h4l2 3h4v12H4z" />
          <path d="M9 14h6M12 11v6" />
          <path d="M7 8v3M17 8v3" />
        </svg>
      );
    case "survival-compass":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8.2" />
          <path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3" />
          <path d="m15.4 8.6-2.1 5.2-4.7 1.6 2.1-5.2 4.7-1.6Z" />
          <circle cx="12" cy="12" r="1" />
        </svg>
      );
    case "backpack":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M8 8V6a4 4 0 0 1 8 0v2" />
          <path d="M6.5 8h11A2.5 2.5 0 0 1 20 10.5V20H4v-9.5A2.5 2.5 0 0 1 6.5 8Z" />
          <path d="M8 14h8v6H8zM4 12H2.8M21.2 12H20M9 11h6" />
        </svg>
      );
    case "map":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" />
          <path d="M9 4v14M15 6v14" />
          <path d="m7 11 2-1 3 2 3-1 2 1" />
        </svg>
      );
    case "radio":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="m7 7 10-4" />
          <rect x="4" y="8" width="16" height="12" rx="2" />
          <circle cx="9" cy="14" r="2.2" />
          <path d="M14 12h3M14 16h3M8 8V6" />
        </svg>
      );
    case "medkit":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
          <rect x="4" y="7" width="16" height="13" rx="2" />
          <path d="M12 11v5M9.5 13.5h5" />
        </svg>
      );
    case "skull-marker":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3c4 0 7 2.8 7 6.7 0 2.3-1 4-2.6 5.1V20H7.6v-5.2C6 13.7 5 12 5 9.7 5 5.8 8 3 12 3Z" />
          <circle cx="9.2" cy="10.5" r="1.2" />
          <circle cx="14.8" cy="10.5" r="1.2" />
          <path d="m11 14 1-1 1 1M9 17h6" />
        </svg>
      );
    case "camp":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 4 4 20h16L12 4Z" />
          <path d="M12 4v16M8.5 20 12 13l3.5 7" />
          <path d="M5 20h14" />
        </svg>
      );
    case "footsteps":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M8.2 4.4c1.2.2 1.9 1.8 1.5 3.6-.4 1.9-1.8 3.2-3 2.9-1.2-.2-1.9-1.8-1.5-3.6.4-1.9 1.8-3.1 3-2.9Z" />
          <path d="M16.8 12.5c1.2.2 1.9 1.8 1.5 3.6-.4 1.9-1.8 3.2-3 2.9-1.2-.2-1.9-1.8-1.5-3.6.4-1.9 1.8-3.1 3-2.9Z" />
          <path d="M7 13.5v.1M12 8.2v.1M12.4 20.5v.1" />
        </svg>
      );
    case "city-ruins":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 20V9l5-2v13M9 20V5l6 3v12M15 20V10l5 2v8" />
          <path d="M6.5 12h.01M6.5 15h.01M11.5 9h.01M11.5 12h.01M17.5 15h.01" />
          <path d="M15 8 13 6M20 12l-2-2M4 9l2-3" />
        </svg>
      );
    case "moss-leaf":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M5 19c7.8-.8 12.3-5.4 14-14-8.6 1.6-13.3 6.2-14 14Z" />
          <path d="M5 19 16 8M8 15c-.8-2.6-.5-5.1.8-7.5M12 11c1.7 0 3.3.4 4.8 1.2" />
        </svg>
      );
    case "gas-mask":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M7 12.5c-1.8-.8-3-2.4-3-4.1C4 5.4 7.1 3 12 3s8 2.4 8 5.4c0 1.7-1.2 3.3-3 4.1" />
          <circle cx="8.2" cy="9.4" r="2" />
          <circle cx="15.8" cy="9.4" r="2" />
          <path d="M9 14.5h6v4.2A2.3 2.3 0 0 1 12.7 21h-1.4A2.3 2.3 0 0 1 9 18.7v-4.2Z" />
          <path d="M10.5 17h3M6 13.5l-2 3M18 13.5l2 3" />
        </svg>
      );
    case "trust-level":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3 5 6v5.8c0 4 2.7 6.8 7 8.2 4.3-1.4 7-4.2 7-8.2V6l-7-3Z" />
          <path d="M8.5 13h7M10 10h4M11.2 16h1.6" />
        </svg>
      );
    case "emotion-filter":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 6h16M7 12h10M10 18h4" />
          <path d="M8 6c0 2 1.4 3.2 4 4 2.6-.8 4-2 4-4" />
          <path d="M9 15c1.6 1 4.4 1 6 0" />
        </svg>
      );
    case "root-system":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3v10" />
          <path d="M12 7 8 4M12 7l4-3" />
          <path d="M12 13c-3.8.8-6 2.8-6.8 6.5" />
          <path d="M12 13c3.8.8 6 2.8 6.8 6.5" />
          <path d="M12 13v7" />
          <path d="M8.5 15.2 5.2 13M15.5 15.2l3.3-2.2" />
          <circle cx="12" cy="3" r="1.2" />
          <circle cx="5.2" cy="19.5" r="1.1" />
          <circle cx="18.8" cy="19.5" r="1.1" />
        </svg>
      );
    case "ai-agent-network":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.6" />
          <circle cx="5" cy="7" r="1.8" />
          <circle cx="19" cy="7" r="1.8" />
          <circle cx="6.5" cy="18" r="1.8" />
          <circle cx="17.5" cy="18" r="1.8" />
          <path d="m7 8 3 2.4M17 8l-3 2.4M8.2 17l2.2-2.6M15.8 17l-2.2-2.6" />
        </svg>
      );
    case "forge-build":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 19h16" />
          <path d="M7 19V9l5-4 5 4v10" />
          <path d="M9 19v-5h6v5" />
          <path d="m6 10 6 3 6-3" />
          <path d="M4 5h3M17 5h3" />
        </svg>
      );
    case "shield-security":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3 5.5 5.6v5.2c0 4.1 2.6 7.8 6.5 9.2 3.9-1.4 6.5-5.1 6.5-9.2V5.6L12 3Z" />
          <path d="m9 12 2 2 4-5" />
        </svg>
      );
    case "terminal":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 6.5h16v11H4z" />
          <path d="m7 10 2.2 2L7 14" />
          <path d="M12 14h5" />
        </svg>
      );
    case "database":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <ellipse cx="12" cy="6" rx="6.5" ry="3" />
          <path d="M5.5 6v6c0 1.7 2.9 3 6.5 3s6.5-1.3 6.5-3V6" />
          <path d="M5.5 12v5c0 1.7 2.9 3 6.5 3s6.5-1.3 6.5-3v-5" />
        </svg>
      );
    case "automation":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 5v3M12 16v3M5 12h3M16 12h3" />
          <circle cx="12" cy="12" r="4" />
          <path d="m7.8 7.8 2.1 2.1M14.1 14.1l2.1 2.1M16.2 7.8l-2.1 2.1M9.9 14.1l-2.1 2.1" />
        </svg>
      );
    case "deployment":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 4v12" />
          <path d="m8 8 4-4 4 4" />
          <path d="M5 16v3h14v-3" />
          <path d="M8 19v1M16 19v1" />
        </svg>
      );
    case "blueprint":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M5 4h14v16H5z" />
          <path d="M8 8h8M8 12h4M8 16h8" />
          <path d="M15 12h1.5v1.5H15z" />
        </svg>
      );
    case "system-status":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 13h4l2-6 4 10 2-4h4" />
          <circle cx="18" cy="6" r="2" />
        </svg>
      );
    case "credit-coin":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="8" />
          <path d="M15.5 9.5c-.8-.9-1.9-1.4-3.2-1.4-2.3 0-4 1.7-4 3.9s1.7 3.9 4 3.9c1.3 0 2.4-.5 3.2-1.4" />
          <path d="M6.5 10.5h6.5M6.5 13.5h6.5" />
        </svg>
      );
    case "wallet":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M5 7.5h13.5A2.5 2.5 0 0 1 21 10v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6.8A2.8 2.8 0 0 1 5.8 4H17v3.5" />
          <path d="M16 13h5" />
          <circle cx="16.5" cy="13" r="1" />
        </svg>
      );
    case "coin-stack":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <ellipse cx="12" cy="6" rx="5.5" ry="2.5" />
          <path d="M6.5 6v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5V6" />
          <path d="M6.5 10v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4" />
          <path d="M6.5 14v4c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-4" />
        </svg>
      );
    case "trading-graph":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 19V5M4 19h17" />
          <path d="m7 15 3-4 3 2 5-7" />
          <path d="M16 6h2v2" />
        </svg>
      );
    case "empire-tower":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3v18" />
          <path d="M8 21V9l4-6 4 6v12" />
          <path d="M5 21v-7l3-2M19 21v-7l-3-2" />
          <path d="M9.5 12h5M9.5 16h5M4 21h16" />
        </svg>
      );
    case "orbit-planet":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3.5" />
          <path d="M3.5 14.5c1.2 2 5.7 2 10.1-.1s7.5-5.3 6.9-7.3c-.4-1.3-2.3-1.6-5-.9" />
          <path d="M20.5 9.5c-1.2-2-5.7-2-10.1.1s-7.5 5.3-6.9 7.3c.4 1.3 2.3 1.6 5 .9" />
        </svg>
      );
    case "market-terminal":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="12" rx="2" />
          <path d="M8 20h8M12 17v3" />
          <path d="m7 13 3-3 2 2 4-5" />
          <path d="M16 7h1.5v1.5" />
        </svg>
      );
    case "calculator":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="6" y="3.5" width="12" height="17" rx="2" />
          <path d="M8.5 7h7M9 11h.01M12 11h.01M15 11h.01M9 14h.01M12 14h.01M15 14h.01M9 17h.01M12 17h.01M15 17h.01" />
        </svg>
      );
    case "vault":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <circle cx="12" cy="12.5" r="3.2" />
          <path d="M12 9.3v6.4M8.8 12.5h6.4M9.8 10.3l4.4 4.4M14.2 10.3l-4.4 4.4" />
        </svg>
      );
    case "leaderboard":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M5 20V9h4v11M10 20V5h4v15M15 20v-8h4v8" />
          <path d="M3.5 20h17" />
          <path d="m12 2.8.6 1.1 1.2.2-.9.9.2 1.2-1.1-.6-1.1.6.2-1.2-.9-.9 1.2-.2.6-1.1Z" />
        </svg>
      );
    case "assets-card":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="4" y="5" width="16" height="14" rx="2" />
          <path d="M7 9h6M7 13h4M15.5 14.5h2" />
          <path d="M15 9h3v3h-3z" />
        </svg>
      );
    case "spending-alert":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3 21 20H3L12 3Z" />
          <path d="M12 8.5v5" />
          <path d="M9.5 16h5" />
          <path d="M14 10c-.5-.5-1.2-.8-2-.8-1.2 0-2 .6-2 1.5 0 2 4 1 4 3 0 .9-.8 1.5-2 1.5-.9 0-1.7-.3-2.2-.9" />
        </svg>
      );
    case "profit-arrow":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 17 9 12l4 3 7-9" />
          <path d="M16 6h4v4" />
          <path d="M5 20h15" />
        </svg>
      );
    case "galactic-map":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <circle cx="5" cy="17" r="1.8" />
          <circle cx="12" cy="7" r="2" />
          <circle cx="19" cy="15" r="1.8" />
          <path d="M6.1 15.5 10.8 8.7M13.8 8.4l4 5.2" />
          <path d="M4 5h.01M8 11h.01M15 19h.01M20 6h.01" />
        </svg>
      );
    case "sneaker":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 15.5c2.3.7 4.1.5 5.4-.7 1.4-1.3 2-3.4 2.2-6.3l4.8 3.5c1.1.8 2.3 1.4 3.6 1.8.7.2 1.1.8 1.1 1.5V18H4v-2.5Z" />
          <path d="M4 18c4.4.9 10.1.9 17 0" />
          <path d="M8.6 14.8h4.2M11.4 10.8l2.1 2M13.7 12.3l2.2 1.8M6 15.8c.6.9 1.8 1.3 3.6 1.1" />
        </svg>
      );
    case "cap":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 14.5c.8-4 3.9-6.8 8.2-6.8 3.3 0 5.9 1.6 7.5 4.3" />
          <path d="M3 15.2c5.6-1.6 10.6-1.2 15 1.2 1.2.6 2.2.6 3-.1" />
          <path d="M7.8 10.2c1.4 1.1 2.8 1.8 4.4 2.1" />
          <path d="M11.2 9.2 13 13l2.1-4.1" />
        </svg>
      );
    case "comic-burst":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="m12 3 1.4 5 4.4-2.8-2 5.1 5.2.7-4.6 2.6 3.4 4-5.2-1.1L12 21l-2.6-4.5-5.2 1.1 3.4-4L3 11l5.2-.7-2-5.1L10.6 8 12 3Z" />
          <path d="M9 12h6M12 9v6" />
        </svg>
      );
    case "hero-shield":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3 5 5.8v5.5c0 4.2 2.7 7.2 7 8.7 4.3-1.5 7-4.5 7-8.7V5.8L12 3Z" />
          <path d="M8.7 12h6.6M12 8.7v6.6" />
          <path d="m9.2 16.2 5.6-8.4" />
        </svg>
      );
    case "lightning-bolt":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M13 2 5 13h6l-1 9 9-13h-6l0-7Z" />
        </svg>
      );
    case "brain-psychology":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6" viewBox="0 0 24 24">
          <path d="M9.4 5.2A3.3 3.3 0 0 0 4.8 8c-1.4.6-2.3 1.9-2.3 3.5 0 1.8 1.2 3.3 2.8 3.7.2 2.1 1.9 3.8 4.1 3.8h1.1V5.2H9.4Z" />
          <path d="M14.6 5.2A3.3 3.3 0 0 1 19.2 8c1.4.6 2.3 1.9 2.3 3.5 0 1.8-1.2 3.3-2.8 3.7-.2 2.1-1.9 3.8-4.1 3.8h-1.1V5.2h1.1Z" />
          <path d="M7 10.5c1.1.1 2 .7 2.7 1.8M17 10.5c-1.1.1-2 .7-2.7 1.8M7.6 15.2c.6-.6 1.4-.9 2.4-.9M16.4 15.2c-.6-.6-1.4-.9-2.4-.9" />
        </svg>
      );
    case "mind-map-nodes":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="2.4" />
          <circle cx="5" cy="6.5" r="1.8" />
          <circle cx="19" cy="6.5" r="1.8" />
          <circle cx="6.5" cy="18" r="1.8" />
          <circle cx="17.5" cy="18" r="1.8" />
          <path d="m6.5 7.7 3.7 2.9M17.5 7.7l-3.7 2.9M8 17l2.5-3M16 17l-2.5-3" />
        </svg>
      );
    case "star-badge":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="m12 3 2.4 4.8 5.3.8-3.8 3.7.9 5.3-4.8-2.5-4.8 2.5.9-5.3-3.8-3.7 5.3-.8L12 3Z" />
          <path d="M8.4 21h7.2" />
        </svg>
      );
    case "street-tag":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 7h10l6 6-7 7-9-9V7Z" />
          <circle cx="8" cy="10" r="1.2" />
          <path d="M10.5 14.5c1.7-1.5 3.2-1.5 4.5 0" />
          <path d="m13 12 2 2 2-2" />
        </svg>
      );
    case "style-badge":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3 5 7v10l7 4 7-4V7l-7-4Z" />
          <path d="M8.5 10.2c.8-.8 1.9-1.2 3.5-1.2 2 0 3.4.9 3.4 2.2 0 2.7-5.2 1.3-5.2 3.4 0 .9 1 1.4 2.5 1.4 1.2 0 2.3-.3 3.1-1" />
        </svg>
      );
    case "trophy":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M8 4h8v5a4 4 0 0 1-8 0V4Z" />
          <path d="M8 6H5a2 2 0 0 0 0 4h3M16 6h3a2 2 0 0 1 0 4h-3" />
          <path d="M12 13v4M9 21h6M10 17h4" />
        </svg>
      );
    case "power-up-dumbbell":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10" />
          <path d="m12 3 1 2 2.2.3-1.6 1.5.4 2.2-2-1.1-2 1.1.4-2.2-1.6-1.5L11 5l1-2Z" />
        </svg>
      );
    case "speech-bubble":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M5 5h14v10H9l-4 4V5Z" />
          <path d="M8 9h8M8 12h5" />
        </svg>
      );
    case "chaos-spark":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
          <path d="m5.6 5.6 3.5 3.5M14.9 14.9l3.5 3.5M18.4 5.6l-3.5 3.5M9.1 14.9l-3.5 3.5" />
          <path d="m12 9 1.2 2.1 2.4.4-1.7 1.7.4 2.4-2.3-1.1-2.3 1.1.4-2.4-1.7-1.7 2.4-.4L12 9Z" />
        </svg>
      );
    case "campus-legend-badge":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 9 12 4l8 5-8 5-8-5Z" />
          <path d="M7 11.2v4.2c1.4 1.2 3.1 1.8 5 1.8s3.6-.6 5-1.8v-4.2" />
          <path d="M20 9v6" />
          <path d="m12 18.2 1.1 1.8 2.1.5-1.4 1.5.2 2-2-1-2 1 .2-2-1.4-1.5 2.1-.5 1.1-1.8Z" />
        </svg>
      );
    case "boxing-glove":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M8.5 4.2c3.2-1.1 6.7.7 7.6 4 .4 1.4.2 2.8-.4 4l2.1 2.8-4 3.3-2.3-2.8c-1.7.2-3.6-.5-4.8-2-2.4-3-1.7-7.8 1.8-9.3Z" />
          <path d="M7.8 13.2 5 15.5l3.8 4.6 3.2-2.7M13.2 6.1c-1.4.2-2.4 1-3 2.2M15.7 12.2c-1 .3-2 .3-3-.1" />
        </svg>
      );
    case "mma-glove":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M7 5.8c0-1.1.8-1.9 1.8-1.9.8 0 1.4.4 1.7 1.1.3-.7.9-1.1 1.7-1.1s1.4.4 1.7 1.1c.3-.6.9-1 1.6-1 1 0 1.8.8 1.8 1.9v5.2l1.1 2.1c.8 1.6.2 3.5-1.3 4.4l-3.2 1.9c-1.8 1-4 .5-5.1-1.3L7 14.7V5.8Z" />
          <path d="M10.5 5v5M13.9 5v5M7 10h10.3M9.2 17l5.4-3.4" />
        </svg>
      );
    case "fight-card":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M5 4.5h14v15H5z" />
          <path d="M8 8h8M8 12h3M13 12h3M8 16h8" />
          <path d="m10 10 4 4M14 10l-4 4" />
        </svg>
      );
    case "corner-stool":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M8 9h8l1.2 3H6.8L8 9Z" />
          <path d="M9 12 7 20M15 12l2 8M12 12v8M7.8 16h8.4" />
          <path d="M7 5h10" />
        </svg>
      );
    case "blue-corner-marker":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 20V4h16" />
          <path d="M7 17V7h10" />
          <path d="M10 14v-4h4" />
          <path d="m15.5 8.5 2-2M18 11h2.5M13 6V3.5" />
        </svg>
      );
    case "guard-shield":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3 5.5 5.6v5.2c0 4 2.6 7.6 6.5 9.2 3.9-1.6 6.5-5.2 6.5-9.2V5.6L12 3Z" />
          <path d="M8.5 13c1.1-2.2 2.3-3.3 3.5-3.3s2.4 1.1 3.5 3.3" />
          <path d="M9.2 15.5h5.6" />
        </svg>
      );
    case "focus-heartbeat":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M3 13h3l2-5 4 10 2.3-6H21" />
          <path d="M12 5.8c1.3-2 4.5-1.8 5.6.4.7 1.5.4 3-.8 4.4" />
          <path d="M12 5.8C10.7 3.8 7.5 4 6.4 6.2c-.2.4-.3.8-.4 1.2" />
        </svg>
      );
    case "silent-mode":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M5 9v6h4l5 4V5L9 9H5Z" />
          <path d="m18 9 3 6M21 9l-3 6" />
        </svg>
      );
    case "watchful-eye":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M3 12s3.4-5.8 9-5.8S21 12 21 12s-3.4 5.8-9 5.8S3 12 3 12Z" />
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 3.5v1.2M12 19.3v1.2" />
        </svg>
      );
    case "smoke-fog":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M5 9c2.4-2.2 4.7-2.2 7 0 1.8 1.8 3.8 1.8 6 0" />
          <path d="M3 14c2.6-2 5.1-2 7.5 0 2 1.7 4.8 1.7 8.5 0" />
          <path d="M6 18c1.5-.8 3-.8 4.5 0 1.5.8 3 .8 4.5 0" />
        </svg>
      );
    case "icy-spark":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3v18M5.6 6.2l12.8 11.6M18.4 6.2 5.6 17.8M4 12h16" />
          <path d="m12 3 2 2M12 3l-2 2M12 21l2-2M12 21l-2-2" />
        </svg>
      );
    case "discipline-badge":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3 5 7v6c0 3.6 2.6 6.1 7 8 4.4-1.9 7-4.4 7-8V7l-7-4Z" />
          <path d="M8.5 12.5h7M10 9.5h4M10 15.5h4" />
        </svg>
      );
    case "strength-mark":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M7 8v8M17 8v8M4 10v4M20 10v4M7 12h10" />
          <path d="M9.5 6.5c.8-1.5 1.6-2.3 2.5-2.3s1.7.8 2.5 2.3" />
        </svg>
      );
    case "calm-status":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="7.5" />
          <path d="M7.5 13.5c1.5 1.4 3 2.1 4.5 2.1s3-.7 4.5-2.1" />
          <path d="M9 10h.01M15 10h.01" />
        </svg>
      );
    case "command-node":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="8" y="8" width="8" height="8" rx="1.4" />
          <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
          <path d="M6 6l2.2 2.2M18 6l-2.2 2.2M6 18l2.2-2.2M18 18l-2.2-2.2" />
        </svg>
      );
    case "forge-hammer":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 20 14.5 9.5" />
          <path d="m13 4 7 7-2.4 2.4-7-7L13 4Z" />
          <path d="m10.6 6.4 3-3M17.6 13.4l3-3" />
          <path d="M3 20h8" />
        </svg>
      );
    case "server-rack":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <rect x="5" y="4" width="14" height="5" rx="1.2" />
          <rect x="5" y="9.5" width="14" height="5" rx="1.2" />
          <rect x="5" y="15" width="14" height="5" rx="1.2" />
          <path d="M8 6.5h.01M8 12h.01M8 17.5h.01M12 6.5h4M12 12h4M12 17.5h4" />
        </svg>
      );
    case "code-brackets":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="m8 7-5 5 5 5M16 7l5 5-5 5" />
          <path d="m14 4-4 16" />
        </svg>
      );
    case "protocol-lock":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M7.5 10V7.8a4.5 4.5 0 0 1 9 0V10" />
          <rect x="5" y="10" width="14" height="10" rx="1.8" />
          <path d="M12 14v2M4 6h2M18 6h2M3 18h2M19 18h2" />
        </svg>
      );
    case "system-core":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
          <path d="m6.4 6.4 2.1 2.1M15.5 15.5l2.1 2.1M17.6 6.4l-2.1 2.1M8.5 15.5l-2.1 2.1" />
          <circle cx="12" cy="12" r="7.8" />
        </svg>
      );
    case "war-room-map":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" />
          <path d="M9 4v14M15 6v14" />
          <path d="m6.5 14 2.5-2 3 1.5 3.5-4 2 1.5" />
          <circle cx="15.5" cy="9.5" r="1" />
        </svg>
      );
    case "power-core":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M12 3v8" />
          <path d="M8 5.2a8 8 0 1 0 8 0" />
          <circle cx="12" cy="13" r="2.2" />
        </svg>
      );
    case "protocol-network":
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
          <path d="M4 7h5l3 5 3-5h5" />
          <path d="M4 17h5l3-5 3 5h5" />
          <circle cx="4" cy="7" r="1.5" />
          <circle cx="20" cy="17" r="1.5" />
        </svg>
      );
  }
}
