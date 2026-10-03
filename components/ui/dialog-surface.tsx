"use client";

import { useEffect, useId, useLayoutEffect, useRef } from "react";
import { createPortal } from "react-dom";

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
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useLayoutEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusable = () => Array.from(panel?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]') ?? [])
      .filter((element) => element.getClientRects().length > 0);
    (panel?.querySelector<HTMLElement>('[data-dialog-autofocus]') ?? focusable()[0] ?? panel)?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
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

  return createPortal(
    <div className="val-dialog-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className={`val-dialog-surface ${className}`} role="dialog" aria-modal="true" aria-labelledby={titleId} ref={panelRef} tabIndex={-1}>
        <header className="val-dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button className="app-icon-button" type="button" aria-label={`Close ${title}`} onClick={onClose}>
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m6 6 12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div className="val-dialog-content">{children}</div>
      </div>
    </div>, document.getElementById("val-app") ?? document.body,
  );
}
