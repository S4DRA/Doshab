"use client";

import Link from "next/link";
import { useEffect, useRef, type ComponentProps } from "react";
import { useExperience } from "@/components/layout/experience-provider";

/** Keep Next navigation/history semantics; preparation needs sustained human intent. */
export function AdaptiveLink({ onPointerEnter, onPointerLeave, onPointerDown, onFocus, onBlur, onNavigate, ...props }: ComponentProps<typeof Link>) {
  const experience = useExperience();
  const cancel = useRef<(() => void) | null>(null);
  useEffect(() => () => cancel.current?.(), []);
  const href = typeof props.href === "string" ? props.href : "";
  const stop = () => { cancel.current?.(); cancel.current = null; };
  return <Link {...props} prefetch={false}
    onPointerEnter={(event) => { onPointerEnter?.(event); if (!event.defaultPrevented && event.pointerType !== "touch") cancel.current = experience?.preparation.intent(href, "pointer") ?? null; }}
    onPointerLeave={(event) => { onPointerLeave?.(event); stop(); }}
    onPointerDown={(event) => { onPointerDown?.(event); stop(); }}
    onFocus={(event) => { onFocus?.(event); if (!event.defaultPrevented) cancel.current = experience?.preparation.intent(href, "focus") ?? null; }}
    onBlur={(event) => { onBlur?.(event); stop(); }}
    onNavigate={(event) => {
      let prevented = false;
      onNavigate?.({ preventDefault: () => { prevented = true; event.preventDefault(); } });
      stop(); if (!prevented) experience?.beginNavigation(href);
    }} />;
}
