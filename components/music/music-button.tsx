"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { MusicErrorBoundary, useMusicSession } from "./music-session-provider";
import { MusicIcon } from "./music-ui";
import "./music.css";

const ListenTogetherPopover = dynamic(() => import("./listen-together-popover").then((m) => m.ListenTogetherPopover), { ssr: false });

export function MusicButton() {
  const music = useMusicSession();
  const [view, setView] = useState<"closed" | "expanded" | "minimized">("closed");
  const buttonRef = useRef<HTMLButtonElement>(null);
  if (!music) return null;
  const close = () => { setView("closed"); buttonRef.current?.focus(); };
  return <MusicErrorBoundary><div className="music-button-anchor">
    <button ref={buttonRef} type="button" className={`music-launch-button${music.session?.state === "PLAYING" ? " is-playing" : ""}`}
      title="Listen Together" aria-label="Listen Together" aria-haspopup="dialog" aria-expanded={view !== "closed"}
      onClick={() => { if (view === "closed") music.refreshNow(); setView(view === "expanded" ? "closed" : "expanded"); }}><MusicIcon name="music" /></button>
    {view !== "closed" && <ListenTogetherPopover minimized={view === "minimized"} onExpand={() => setView("expanded")} onMinimize={() => setView("minimized")} onClose={close} anchor={buttonRef} />}
  </div></MusicErrorBoundary>;
}
