import Link from "next/link";
import { Big_Shoulders } from "next/font/google";

const editorial = Big_Shoulders({
  variable: "--font-val-display",
  subsets: ["latin", "latin-ext"],
  weight: ["700", "900"],
  display: "swap",
  adjustFontFallback: false,
  fallback: ["Arial Narrow", "Arial", "sans-serif"],
});
export const publicFontClass = editorial.variable;

function PublicLogo() {
  return <span className="val-public-logo" aria-hidden="true">
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/brand/val-mark-256.png" srcSet="/brand/val-mark-256.png 256w, /brand/val-mark-512.png 512w" sizes="52px" alt="" width="256" height="256" decoding="async" fetchPriority="high" />
  </span>;
}

export function Arrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

export function WindowsIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2 3h9v8H2zm11 0h9v8h-9zM2 13h9v8H2zm11 0h9v8h-9z" /></svg>;
}

export function PublicHeader({ download = false }: { download?: boolean }) {
  return <header className="val-public-header"><div className="val-public-wrap val-public-header-inner">
    <Link className="val-public-brand" href="/" aria-label="VAL home"><PublicLogo /><span>VAL</span><span className="val-public-brand-caption">A space<br />of your own.</span></Link>
    <nav aria-label="Main navigation"><Link className="val-public-nav-features" href="/#features">Explore VAL</Link><Link href="/download" aria-current={download ? "page" : undefined}>Download <span aria-hidden="true">↙</span></Link><Link href="/login" className="val-public-nav-login">Log in <span aria-hidden="true">↗</span></Link></nav>
  </div></header>;
}

export function PublicFooter() {
  return <footer className="val-public-footer val-public-wrap"><Link className="val-public-footer-brand" href="/">VAL<span>People. Ideas. Further.</span></Link><nav aria-label="Footer navigation"><Link href="/download">Windows download</Link><Link href="/login">Log in</Link><Link href="/register">Create account</Link></nav><span className="val-public-footer-note">A little corner of the internet.<br />A little closer to your people.</span></footer>;
}
