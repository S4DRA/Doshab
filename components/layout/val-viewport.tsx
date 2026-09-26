"use client";

import { useEffect } from "react";

/** Keep the communication surface inside the visual viewport without disabling zoom. */
export function ValViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;
    let frame = 0;
    function update() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (viewport && viewport.scale !== 1) return;
        const height = viewport?.height ?? window.innerHeight;
        const top = viewport?.offsetTop ?? 0;
        const focused = document.activeElement;
        const editing = focused instanceof HTMLElement && (focused.matches("input, textarea") || focused.isContentEditable);
        const keyboard = editing && window.innerHeight - height - top > 100;
        root.style.setProperty("--val-viewport-height", `${height}px`);
        root.style.setProperty("--val-viewport-top", `${keyboard ? top : 0}px`);
        root.dataset.valKeyboard = keyboard ? "open" : "closed";
      });
    }
    update();
    viewport?.addEventListener("resize", update);
    viewport?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    document.addEventListener("focusin", update);
    document.addEventListener("focusout", update);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", update);
      viewport?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.removeEventListener("focusin", update);
      document.removeEventListener("focusout", update);
      root.style.removeProperty("--val-viewport-height");
      root.style.removeProperty("--val-viewport-top");
      delete root.dataset.valKeyboard;
    };
  }, []);
  return null;
}
