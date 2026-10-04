"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { mobileHomeOrderKey, moveMobileHomeSection, normalizeMobileHomeOrder, type MobileHomeSection } from "@/lib/mobile-home-order";

type HomeSection = { title: string; render: (handle: ReactNode) => ReactNode };
type Drag = {
  id: MobileHomeSection; original: MobileHomeSection[]; button: HTMLButtonElement;
  pointerId?: number; y: number; startY: number; offset: number; height: number; translate: number;
};

function dragTop(current: Drag, root: HTMLElement | null) {
  const list = root?.getBoundingClientRect();
  const viewport = root?.closest(".val-mobile-home")?.getBoundingClientRect();
  if (!list || !viewport) return current.y - current.offset;
  const top = Math.max(list.top, viewport.top);
  const bottom = Math.max(top, Math.min(list.bottom, viewport.bottom) - current.height);
  return Math.max(top, Math.min(current.y - current.offset, bottom));
}

function readOrder(userId: string) {
  if (typeof window === "undefined") return { order: normalizeMobileHomeOrder(null), warning: "" };
  try { return { order: normalizeMobileHomeOrder(JSON.parse(localStorage.getItem(mobileHomeOrderKey(userId)) ?? "null")), warning: "" }; }
  catch (error) {
    console.warn("Home layout preferences could not be read", error);
    return { order: normalizeMobileHomeOrder(null), warning: "Saved layout is unavailable. You can still move sections for this visit." };
  }
}

/** Only mounted by the mobile Home composition; no private content is persisted. */
export function MobileHomeSections({ userId, sections }: { userId: string; sections: Record<MobileHomeSection, HomeSection> }) {
  const [initial] = useState(() => readOrder(userId));
  const [order, setOrder] = useState(initial.order);
  const orderRef = useRef(order);
  const root = useRef<HTMLDivElement>(null);
  const drag = useRef<Drag | null>(null);
  const frame = useRef<number | null>(null);
  const [active, setActive] = useState<MobileHomeSection | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const [warning, setWarning] = useState(initial.warning);
  const helpId = useId();
  const nodeFor = (id: MobileHomeSection) => root.current?.querySelector<HTMLElement>(`[data-home-section="${id}"]`);
  const update = (next: MobileHomeSection[]) => { orderRef.current = next; setOrder(next); };
  const announcePosition = (id: MobileHomeSection) => setAnnouncement(`${sections[id].title}, position ${orderRef.current.indexOf(id) + 1} of ${orderRef.current.length}.`);

  const finish = (cancel = false, focus = true) => {
    const current = drag.current;
    if (!current) return;
    drag.current = null;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const node = nodeFor(current.id);
    if (node) node.style.transform = "";
    setActive(null);
    if (cancel) { update(current.original); setAnnouncement(`Moving ${sections[current.id].title} cancelled.`); }
    else {
      announcePosition(current.id);
      if (orderRef.current.some((id, index) => id !== current.original[index])) {
        try { localStorage.setItem(mobileHomeOrderKey(userId), JSON.stringify(orderRef.current)); setWarning(""); }
        catch (error) { console.warn("Home layout preferences could not be saved", error); setWarning("Layout changed for this visit. Saving on this device is unavailable."); }
      }
    }
    if (focus) current.button.focus({ preventScroll: true });
  };

  const place = (current: Drag) => {
    const node = nodeFor(current.id);
    if (!node) return;
    const top = node.getBoundingClientRect().top - current.translate;
    current.translate = dragTop(current, root.current) - top;
    node.style.transform = `translateY(${current.translate}px)`;
  };
  const movePointer = (current: Drag) => {
    place(current);
    if (Math.abs(current.y - current.startY) < 6) return;
    const center = dragTop(current, root.current) + current.height / 2;
    const others = orderRef.current.filter((id) => id !== current.id);
    const index = others.filter((id) => { const rect = nodeFor(id)?.getBoundingClientRect(); return rect && center > rect.top + rect.height / 2; }).length;
    if (index !== orderRef.current.indexOf(current.id)) { update(moveMobileHomeSection(orderRef.current, current.id, index)); setAnnouncement(`${sections[current.id].title}, position ${index + 1} of ${orderRef.current.length}.`); }
  };
  const scrollWhileDragging = () => {
    const current = drag.current;
    const scroll = root.current?.closest<HTMLElement>(".val-mobile-home");
    if (!current || current.pointerId === undefined || !scroll) return;
    const rect = scroll.getBoundingClientRect();
    if (Math.abs(current.y - current.startY) >= 6) {
      const direction = current.y < rect.top + 56 ? -1 : current.y > rect.bottom - 56 ? 1 : 0;
      if (direction) scroll.scrollTop += direction * 10;
      movePointer(current);
    }
    frame.current = requestAnimationFrame(scrollWhileDragging);
  };

  useLayoutEffect(() => {
    const current = drag.current;
    if (!current) return;
    // React moved the item in flow; preserve its finger position after that move.
    const node = root.current?.querySelector<HTMLElement>(`[data-home-section="${current.id}"]`);
    if (node && current.pointerId !== undefined) {
      node.style.transform = "";
      current.translate = dragTop(current, root.current) - node.getBoundingClientRect().top;
      node.style.transform = `translateY(${current.translate}px)`;
    }
    current.button.focus({ preventScroll: true });
    if (current.pointerId === undefined) current.button.scrollIntoView({ block: "nearest" });
  }, [order]);
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);

  const handle = (id: MobileHomeSection) => <button className="val-home-drag-handle" type="button" aria-label={`Reorder ${sections[id].title}`} aria-describedby={helpId} aria-pressed={active === id}
    title="Drag up or down. Or press Space, arrow keys, then Space to drop." onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
    onPointerDown={(event) => {
      if (!event.isPrimary || event.button !== 0) return;
      event.preventDefault();
      finish(true);
      const node = nodeFor(id);
      if (!node) return;
      const rect = node.getBoundingClientRect();
      event.currentTarget.focus({ preventScroll: true });
      root.current?.setPointerCapture(event.pointerId);
      drag.current = { id, original: [...orderRef.current], button: event.currentTarget, pointerId: event.pointerId, y: event.clientY, startY: event.clientY, offset: event.clientY - rect.top, height: rect.height, translate: 0 };
      setActive(id); announcePosition(id); frame.current = requestAnimationFrame(scrollWhileDragging);
    }}
    onKeyDown={(event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        if (drag.current?.id === id) finish();
        else { finish(true); drag.current = { id, original: [...orderRef.current], button: event.currentTarget, y: 0, startY: 0, offset: 0, height: 0, translate: 0 }; setActive(id); setAnnouncement(`${sections[id].title} picked up. Use up and down arrow keys to move, Space to drop, or Escape to cancel.`); }
      } else if (drag.current?.id === id && drag.current.pointerId === undefined) {
        if (event.key === "ArrowUp" || event.key === "ArrowDown") { event.preventDefault(); update(moveMobileHomeSection(orderRef.current, id, orderRef.current.indexOf(id) + (event.key === "ArrowUp" ? -1 : 1))); announcePosition(id); }
        else if (event.key === "Escape") { event.preventDefault(); finish(true); }
        else if (event.key === "Tab") finish(false, false);
      } else if (event.key === "Escape" && drag.current?.id === id) { event.preventDefault(); finish(true); }
    }}>
    <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">{[6, 12, 18].map((y) => <g key={y}><circle cx="8" cy={y} r="1.5" /><circle cx="16" cy={y} r="1.5" /></g>)}</svg>
  </button>;

  return <div className="val-home-sections" ref={root}
    onPointerMove={(event) => { const current = drag.current; if (current?.pointerId === event.pointerId) { current.y = event.clientY; movePointer(current); } }}
    onPointerUp={(event) => { if (drag.current?.pointerId === event.pointerId) finish(); }}
    onPointerCancel={(event) => { if (drag.current?.pointerId === event.pointerId) finish(true); }}
    onLostPointerCapture={(event) => { if (drag.current?.pointerId === event.pointerId) finish(true); }}>
    <span id={helpId} className="sr-only">Drag a section handle up or down. With a keyboard, press Space to pick up, use arrow keys to move, Space to drop, or Escape to cancel.</span>
    <span className="sr-only" role="status" aria-live="polite">{announcement}</span>
    {warning && <p className="val-home-order-warning" role="status">{warning}</p>}
    {order.map((id) => <div className={`val-home-sortable${active === id ? " is-dragging" : ""}`} data-home-section={id} key={id}>{sections[id].render(handle(id))}</div>)}
  </div>;
}
