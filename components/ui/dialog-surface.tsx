"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { mobileLayoutQuery } from "@/lib/mobile-navigation";

/** A bounded sheet on phones and a centered panel on larger screens. */
export function DialogSurface({ children, title, onClose, className = "" }: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  className?: string;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const router = useRouter();
  const historyMarker = useRef<string | null>(null);
  const pendingHref = useRef<string | null>(null);
  const closing = useRef(false);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  const requestClose = () => {
    if (closing.current) return;
    if (historyMarker.current && history.state?.valSheet === historyMarker.current) { closing.current = true; history.back(); }
    else closeRef.current();
  };
  const requestCloseRef = useRef(requestClose);
  useEffect(() => { requestCloseRef.current = requestClose; });
  useLayoutEffect(() => {
    if (!window.matchMedia(mobileLayoutQuery).matches) return;
    const marker = crypto.randomUUID();
    historyMarker.current = marker;
    const openedUrl = window.location.href;
    const previousState = { ...history.state };
    const replacingSheet = Boolean(previousState.valSheet);
    delete previousState.valSheet;
    if (replacingSheet) history.replaceState({ ...previousState, valSheet: marker }, "", openedUrl);
    else history.pushState({ ...previousState, valSheet: marker }, "", openedUrl);
    const back = () => {
      if (history.state?.valSheet === marker) return;
      historyMarker.current = null;
      closeRef.current();
      if (pendingHref.current) router.push(pendingHref.current);
    };
    window.addEventListener("popstate", back);
    return () => {
      window.removeEventListener("popstate", back);
      queueMicrotask(() => {
        if (history.state?.valSheet !== marker) return;
        if (window.location.href === openedUrl) history.back();
        else { const currentState = { ...history.state }; delete currentState.valSheet; history.replaceState(currentState, "", window.location.href); }
      });
    };
  }, [router]);
  useLayoutEffect(() => {
    // A mobile sheet owns interaction until it closes. Preserve each sibling's
    // existing state so transitions between sheets cannot enable the background.
    if (!window.matchMedia(mobileLayoutQuery).matches) return;
    const backdrop = panelRef.current?.parentElement;
    const siblings = Array.from(backdrop?.parentElement?.children ?? [])
      .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== backdrop);
    const previous = siblings.map((element) => element.inert);
    siblings.forEach((element) => { element.inert = true; });
    return () => siblings.forEach((element, index) => { element.inert = previous[index]; });
  }, []);
  useLayoutEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]') ?? [])
      .filter((element) => element.getClientRects().length > 0);
    (panel?.querySelector<HTMLElement>('[data-dialog-autofocus]') ?? focusable()[0] ?? panel)?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); requestCloseRef.current(); }
      if (event.key !== "Tab") return;
      const targets = focusable();
      const first = targets[0];
      const last = targets.at(-1);
      if (!first) { event.preventDefault(); panel?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    function keepFocus(event: FocusEvent) {
      if (event.target instanceof Node && panel && !panel.contains(event.target)) (focusable()[0] ?? panel).focus();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", keepFocus);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", keepFocus);
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);
  useLayoutEffect(() => {
    panelRef.current?.querySelector<HTMLElement>('[data-dialog-autofocus], button:not([disabled]), input:not([disabled]), a[href]')?.focus();
  }, [title]);

  return createPortal(
    <div className="val-dialog-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) requestClose(); }}>
      <div className={`val-dialog-surface ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef} tabIndex={-1} onClickCapture={(event) => {
        const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
        if (!link || !historyMarker.current || event.metaKey || event.ctrlKey || event.shiftKey || link.target === "_blank") return;
        const target = new URL(link.href);
        if (target.origin !== location.origin) return;
        event.preventDefault(); event.stopPropagation();
        pendingHref.current = `${target.pathname}${target.search}${target.hash}`;
        requestClose();
      }}>
        <header className="val-dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button className="app-icon-button" type="button" aria-label={`Close ${title}`} onClick={requestClose}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div className="val-dialog-content">{children}</div>
      </div>
    </div>, document.getElementById("val-app") ?? document.body,
  );
}
