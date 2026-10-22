import Link from "next/link";
import { PublicFooter, PublicHeader, Arrow, WindowsIcon } from "@/components/layout/public-shell";
import { WorkspacePreview } from "@/components/layout/workspace-preview";

const features = [
  ["01", "A place for every conversation.", "Keep plans, everyday chat, and shared ideas in their own channels. Everything has a home."],
  ["02", "Less planning. More talking.", "See who’s in a voice room, join the conversation, and keep talking as you move around VAL."],
  ["03", "Your people, closer.", "Message a friend, invite them into a space, and make something that feels like your own corner of the internet."],
];

export default function Home() {
  return (
    <div className="val-public" id="public-top">
      <a className="val-skip-link" href="#home-content">Skip to content</a>
      <PublicHeader />
      <main id="home-content">
        <section className="val-public-hero val-public-wrap" aria-labelledby="home-title">
          <div className="val-public-overline"><span>People. Ideas. Further.</span><span>Voice / chat / shared spaces</span></div>
          <div className="val-public-hero-grid">
            <div className="val-public-hero-copy">
              <p className="val-public-kicker">A little closer. A little more you.</p>
              <h1 id="home-title">GOOD COMPANY.<br />YOUR OWN <em>SPACE.</em></h1>
              <p className="val-public-lead">A place to talk, share ideas, and spend time with your people. Bring your conversations together. Make yourself at home.</p>
              <div className="val-public-actions">
                <Link href="/register" className="val-public-button">Find your space <Arrow /></Link>
                <Link href="/download" className="val-public-button val-public-button-outline"><WindowsIcon /> Download for Windows</Link>
              </div>
              <p className="val-public-footnote">Already here? <Link href="/login">Open VAL in your browser <span aria-hidden="true">↗</span></Link></p>
            </div>
            <div className="val-public-signal" aria-hidden="true">
              <span className="val-public-signal-label">VAL / A space of your own</span>
              <div className="val-public-orbits"><i /><i /><i /></div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/val-mark-512.png" alt="" width="512" height="512" fetchPriority="high" />
              <span className="val-public-signal-caption">ROOM FOR<br />YOUR PEOPLE<span>.</span></span>
              <span className="val-public-signal-index">↗</span>
            </div>
          </div>
          <WorkspacePreview />
        </section>
        <section id="features" className="val-public-features val-public-wrap" aria-labelledby="features-title">
          <div className="val-public-section-heading"><p className="val-public-kicker">01 / Together, without the clutter</p><h2 id="features-title">EVERYDAY CONNECTION.<br /><em>A LITTLE MORE HUMAN.</em></h2><p>Clear spaces. Familiar controls. More room for the conversation that matters.</p></div>
          <div className="val-public-feature-grid">{features.map(([number, title, description]) => <article className="val-public-feature" key={number}><span className="val-public-index">{number} /</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        </section>
        <section className="val-public-windows" aria-labelledby="windows-title">
          <div className="val-public-wrap val-public-windows-grid">
            <div className="val-public-desktop-art" aria-hidden="true"><div className="val-public-mini-title"><span>VAL for Windows</span><span>— &nbsp; □ &nbsp; ×</span></div><div className="val-public-desktop-inner"><WindowsIcon /><span>YOUR SPACE.<br /><b>ON YOUR DESKTOP.</b></span></div><div className="val-public-desktop-bottom"><span>One VAL account</span><span>Windows x64 ↗</span></div></div>
            <div className="val-public-windows-copy"><p className="val-public-kicker">02 / Make it feel at home</p><h2 id="windows-title">LESS TABS.<br /><em>MORE TOGETHER.</em></h2><p>Give VAL a place on your desktop. Your spaces, messages, and friends stay connected to the same account you use on the web.</p><Link href="/download" className="val-public-button"><WindowsIcon /> Get VAL for Windows <Arrow /></Link><p className="val-public-footnote">Windows 10 or later · 64-bit<br />On another device? <Link href="/login">Use VAL in your browser.</Link></p></div>
          </div>
        </section>
        <section className="val-public-comfort val-public-wrap" aria-labelledby="comfort-title"><div><p className="val-public-kicker">03 / Settle in</p><h2 id="comfort-title">BUILT FOR YOUR<br /><em>KIND OF DAY.</em></h2></div><div className="val-public-comfort-copy"><p>Light when you want breathing room. Dark when you want to settle down. Choose your palette and keep your space feeling familiar.</p><p>On a small screen, the conversation comes first, with room to read and controls within reach.</p><Link href="/register" className="val-public-text-link">Make yourself at home <Arrow /></Link></div></section>
        <section className="val-public-join val-public-wrap" aria-labelledby="join-title"><p className="val-public-kicker">There’s room for you here.</p><h2 id="join-title">LET’S MAKE <em>SPACE.</em></h2><Link href="/register" className="val-public-button">Create your account <Arrow /></Link></section>
      </main>
      <PublicFooter />
    </div>
  );
}
