"use client";

import { useEffect, useRef, type RefObject, type PointerEvent, type KeyboardEvent } from "react";

// Position updates bypass React so dragging never rerenders playback or search.
export function usePlayerPosition(anchor: RefObject<HTMLButtonElement | null>) {
  const panel = useRef<HTMLDivElement>(null);
  const moved = useRef(false);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const place = (left: number, top: number) => {
    const node = panel.current;
    if (!node) return;
    const viewport = window.visualViewport;
    const x = viewport?.offsetLeft ?? 0, y = viewport?.offsetTop ?? 0;
    const width = viewport?.width ?? window.innerWidth, height = viewport?.height ?? window.innerHeight;
    node.style.left = `${Math.max(x + 8, Math.min(left, x + width - node.offsetWidth - 8))}px`;
    node.style.top = `${Math.max(y + 8, Math.min(top, y + height - node.offsetHeight - 8))}px`;
    node.style.bottom = "auto";
    node.style.maxHeight = `${Math.max(120, height - 16)}px`;
  };
  const placeRef = useRef(place);
  useEffect(() => { placeRef.current = place; });

  useEffect(() => {
    const position = () => {
      const node = panel.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const button = anchor.current?.getBoundingClientRect();
      if (!moved.current && button) placeRef.current(button.left + button.width / 2 - rect.width / 2, button.top - rect.height - 12);
      else placeRef.current(rect.left, rect.top);
    };
    const observer = new ResizeObserver(position);
    if (panel.current) observer.observe(panel.current);
    position();
    window.addEventListener("resize", position);
    window.visualViewport?.addEventListener("resize", position);
    window.visualViewport?.addEventListener("scroll", position);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("resize", position);
      window.visualViewport?.removeEventListener("scroll", position);
    };
  }, [anchor, panel]);

  const finish = (event: PointerEvent<HTMLButtonElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    drag.current = null;
    panel.current?.classList.remove("music-is-dragging");
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return {
    panel,
    onPointerDown: (event: PointerEvent<HTMLButtonElement>) => {
      if (!event.isPrimary || event.button !== 0 || !panel.current) return;
      const rect = panel.current.getBoundingClientRect();
      moved.current = true;
      drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top };
      event.currentTarget.setPointerCapture(event.pointerId);
      panel.current.classList.add("music-is-dragging");
    },
    onPointerMove: (event: PointerEvent<HTMLButtonElement>) => {
      const start = drag.current;
      if (!start || start.id !== event.pointerId) return;
      place(start.left + event.clientX - start.x, start.top + event.clientY - start.y);
    },
    onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish,
    onKeyDown: (event: KeyboardEvent<HTMLButtonElement>) => {
      const delta: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      const direction = delta[event.key];
      if (!direction || !panel.current) return;
      event.preventDefault();
      moved.current = true;
      const rect = panel.current.getBoundingClientRect(), step = event.shiftKey ? 40 : 10;
      place(rect.left + direction[0] * step, rect.top + direction[1] * step);
    },
  };
}
