import Link from "next/link";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { LogoMark } from "@/components/ui/logo-mark";

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

export function AuthCard({ title, subtitle, children, footerText, footerHref, footerLinkText, error, notice }: AuthCardProps) {
  return <main className="val-auth">
    <section className="val-auth-card" aria-labelledby="auth-title">
      <aside className="val-auth-story">
        <Link className="val-auth-brand" href="/" aria-label="VAL home"><LogoMark className="val-auth-logo" preload sizes="50px" />VAL</Link>
        <h2>GOOD COMPANY.<br />YOUR OWN <em>SPACE.</em></h2>
        <p>A place for your people, your ideas, and the conversations in between.</p>
        <div className="val-auth-story-note">VAL / PEOPLE. IDEAS. FURTHER.<br /><Link href="/download">Bring VAL to your Windows desktop ↗</Link></div>
      </aside>
      <div className="val-auth-form-panel">
        <Link href="/" className="val-auth-back">← Back to VAL</Link>
        <h1 id="auth-title">{title}</h1><p className="val-auth-subtitle">{subtitle}</p>
        {error ? <div className="mb-5"><Alert tone="error">{error}</Alert></div> : null}
        {notice ? <div className="mb-5"><Alert tone="success">{notice}</Alert></div> : null}
        {children}
        <p className="val-auth-footer">{footerText}{" "}<Link href={footerHref}>{footerLinkText}</Link></p>
      </div>
    </section>
  </main>;
}
