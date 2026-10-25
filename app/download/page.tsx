import type { Metadata } from "next";
import Link from "next/link";
import { PublicFooter, PublicHeader, Arrow, WindowsIcon, publicFontClass } from "@/components/layout/public-shell";
import { getWindowsRelease, windowsReleasesUrl } from "@/lib/desktop-download";

export const metadata: Metadata = { title: "Download VAL for Windows", description: "Bring your VAL spaces, messages, and voice rooms to your Windows desktop." };

export default async function DownloadPage({ searchParams }: { searchParams: Promise<{ unavailable?: string }> }) {
  // Match the installer click's current, complete release instead of a stale label.
  const [release, params] = await Promise.all([getWindowsRelease(true), searchParams]);
  return <div className={`val-public val-download-page ${publicFontClass}`}>
    <a className="val-skip-link" href="#download-content">Skip to content</a><PublicHeader download />
    <main id="download-content" className="val-public-wrap">
      <div className="val-public-overline"><span>VAL / Windows desktop</span><Link href="/">Back to VAL ↗</Link></div>
      <section className="val-download-hero" aria-labelledby="download-title">
        <div><p className="val-public-kicker">Your people. One window away.</p><h1 id="download-title">MAKE ROOM<br />FOR <em>VAL.</em></h1><p className="val-public-lead">Your familiar space, with a home on your desktop. Sign in with your VAL account and pick up the conversation.</p>
          {release ? <><a className="val-public-button" href="/download/windows"><WindowsIcon /> Download for Windows <Arrow /></a><p className="val-public-footnote">Version {release.version} · {Math.ceil(release.size / 1_000_000)} MB<br />Windows 10 or later · 64-bit</p></> : <div className="val-download-availability" role="status"><b>The download is currently unavailable.</b><p>{params.unavailable ? "Please try again in a little while. Your spaces are still available in the browser." : "Check the public releases below, or use VAL in your browser while the installer is unavailable."}</p><Link className="val-public-button" href="/login">Open VAL in your browser <Arrow /></Link></div>}
          <p className="val-public-footnote"><a href={windowsReleasesUrl}>View releases on GitHub <span aria-hidden="true">↗</span></a></p>
        </div>
        <div className="val-download-mark" aria-hidden="true">
          <div className="val-public-orbits"><i /><i /><i /></div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/val-mark-512.png" alt="" width="512" height="512" />
          <span>VAL / WINDOWS x64</span>
        </div>
      </section>
      <section className="val-download-details" aria-labelledby="install-title"><div><p className="val-public-kicker">A familiar place, in a few steps.</p><h2 id="install-title">SETTLE <em>IN.</em></h2></div><ol><li><span>01</span><div><h3>Download the installer</h3><p>Save the VAL Setup file to your Windows computer.</p></div></li><li><span>02</span><div><h3>Make it yours</h3><p>Open the installer and choose where VAL lives and which shortcuts you want.</p></div></li><li><span>03</span><div><h3>Pick up the conversation</h3><p>Sign in with your existing account. Your friends and spaces are already there.</p></div></li></ol></section>
      <div className="val-download-notes"><p><b>One account, wherever you are.</b> Website improvements appear in the desktop app when it reloads. Desktop app updates download when a new stable release is published and install after you fully quit VAL.</p><p>VAL’s current Windows installer is unsigned, so Windows may show a publisher warning. Check that your download came from the S4DRA/Doshab GitHub release before installing.</p></div>
    </main><PublicFooter />
  </div>;
}
