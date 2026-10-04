import Link from "next/link";
import type { ReactNode } from "react";

export function MobileIcon({ name }: { name: "home" | "spaces" | "groups" | "friends" | "search" | "profile" | "bell" | "back" | "next" | "plus" | "chat" | "voice" | "close" | "settings" }) {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    {name === "home" && <><path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z" /></>}
    {name === "groups" && <><circle cx="9" cy="7" r="3" /><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 4a3 3 0 0 1 0 6m2 11v-3a7 7 0 0 0-2-5" /></>}
    {name === "friends" && <><path d="m3 5-1 9h3M21 5l1 9h-3M5 7h4l2-1h3l5 3M8 8l-1 1a2 2 0 0 0 3 3l2-2 6 5a2 2 0 0 1-3 3l-4-3M5 13l6 6a2 2 0 0 0 3-1M18 15l1-2" /></>}
    {name === "spaces" && <><path d="m12 3 9 5-9 5-9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>}
    {name === "profile" && <><circle cx="12" cy="7" r="4" /><path d="M3 22v-3a9 9 0 0 1 18 0v3" /></>}
    {name === "search" && <><circle cx="10.5" cy="10.5" r="7.5" /><path d="m16 16 5 5" /></>}
    {name === "bell" && <><path d="M4 17h16l-2-3V9a6 6 0 0 0-12 0v5ZM9 21h6" /></>}
    {name === "back" && <path d="m14 4-8 8 8 8M6 12h15" />}
    {name === "next" && <path d="m9 5 7 7-7 7" />}
    {name === "plus" && <path d="M12 4v16M4 12h16" />}
    {name === "close" && <path d="m6 6 12 12M18 6 6 18" />}
    {name === "chat" && <path d="M21 11a9 9 0 0 1-9 9H3v-9a9 9 0 1 1 18 0Z" />}
    {name === "voice" && <><path d="M3 17v-5a9 9 0 0 1 18 0v5" /><rect x="3" y="13" width="4" height="8" rx="1" /><rect x="17" y="13" width="4" height="8" rx="1" /></>}
    {name === "settings" && <><path d="m9 3-1 3-3 1 1 3-2 2 2 2-1 3 3 1 1 3h6l1-3 3-1-1-3 2-2-2-2 1-3-3-1-1-3Z" /><circle cx="12" cy="12" r="3" /></>}
  </svg>;
}

export function MobileHeading({ title, back, action }: { title: string; back?: string; action?: ReactNode }) {
  return <header className="val-mobile-heading">{back && <Link className="val-mobile-icon-button" href={back} aria-label="Back"><MobileIcon name="back" /></Link>}<h1>{title}</h1>{action}</header>;
}

export function MobileSection({ title, href, action, children }: { title: string; href?: string; action?: ReactNode; children: ReactNode }) {
  const link = href && <Link href={href}>View all <MobileIcon name="next" /></Link>;
  return <section className="val-mobile-section"><header><h2>{title}</h2>{action ? <div className="val-mobile-section-actions">{link}{action}</div> : link}</header>{children}</section>;
}

export function MobileEmpty({ children }: { children: ReactNode }) {
  return <p className="val-mobile-empty">{children}</p>;
}
