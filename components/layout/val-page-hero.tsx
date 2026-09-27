import type { ReactNode } from "react";

/** Shared editorial header; decoration never conveys live product status. */
export function ValPageHero({ eyebrow, title, accent, description, actions, children }: {
  eyebrow: string;
  title: string;
  accent?: string;
  description: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="val-page-hero">
      <div className="val-hero-overline"><span>VAL / {eyebrow}</span><span>People. Ideas. Further.</span></div>
      <div className="val-hero-layout">
        <div className="val-hero-copy">
          <h1>{title}{accent ? <> <em>{accent}</em></> : <em>.</em>}</h1>
          <p>{description}</p>
          {actions ? <div className="val-hero-actions">{actions}</div> : null}
        </div>
        <div className="val-lunar-banner" aria-hidden="true">
          <span>A more<br />human<br />internet <b>—</b></span>
        </div>
      </div>
      {children ? <div className="val-hero-tools">{children}</div> : null}
    </header>
  );
}
