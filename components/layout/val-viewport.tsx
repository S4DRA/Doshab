"use client";

import { useEffect } from "react";
import { resolveViewport } from "@/lib/viewport";

/** Keep the communication surface inside the visual viewport without disabling zoom. */
export function ValViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;
    let baseline: { width: number; height: number } | null = null;
    function measure() {
      const focused = document.activeElement;
      const editing = focused instanceof HTMLElement && (focused.matches("input, textarea") || focused.isContentEditable);
      const next = resolveViewport({ width: window.innerWidth, layoutHeight: window.innerHeight,
        visibleHeight: viewport?.height ?? window.innerHeight, offsetTop: viewport?.offsetTop ?? 0,
        scale: viewport?.scale ?? 1, editing, baseline });
      if (!next) return;
      baseline = next.baseline;
      root.style.setProperty("--val-viewport-height", `${next.height}px`);
      root.style.setProperty("--val-viewport-top", `${next.top}px`);
      root.dataset.valKeyboard = next.keyboard ? "open" : "closed";
    }
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    }
    function refresh() { cancelAnimationFrame(frame); measure(); }
    refresh();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("orientationchange", update);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("orientationchange", update);
      document.removeEventListener("visibilitychange", refresh);
      root.style.removeProperty("--val-viewport-height");
      root.style.removeProperty("--val-viewport-top");
      delete root.dataset.valKeyboard;
    };
  }, []);
  return null;
}
