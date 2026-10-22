import Link from "next/link";
import { LogoMark } from "@/components/ui/logo-mark";

export function Arrow() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 12h15m-6-6 6 6-6 6" /></svg>;
}

export function WindowsIcon() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M2 3h9v8H2zm11 0h9v8h-9zM2 13h9v8H2zm11 0h9v8h-9z" /></svg>;
}

export function PublicHeader({ download = false }: { download?: boolean }) {
  return <header className="val-public-header"><div className="val-public-wrap val-public-header-inner">
    <Link className="val-public-brand" href="/" aria-label="VAL home"><LogoMark className="val-public-logo" preload sizes="52px" /><span>VAL</span><span className="val-public-brand-caption">A space<br />of your own.</span></Link>
    <nav aria-label="Main navigation"><Link className="val-public-nav-features" href="/#features">Explore VAL</Link><Link href="/download" aria-current={download ? "page" : undefined}>Download <span aria-hidden="true">↙</span></Link><Link href="/login" className="val-public-nav-login">Log in <span aria-hidden="true">↗</span></Link></nav>
  </div></header>;
}

export function PublicFooter() {
  return <footer className="val-public-footer val-public-wrap"><Link className="val-public-footer-brand" href="/">VAL<span>People. Ideas. Further.</span></Link><nav aria-label="Footer navigation"><Link href="/download">Windows download</Link><Link href="/login">Log in</Link><Link href="/register">Create account</Link></nav><span className="val-public-footer-note">A little corner of the internet.<br />A little closer to your people.</span></footer>;
}
