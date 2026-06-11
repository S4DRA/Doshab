"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  preload?: boolean;
  sizes?: string;
};

const primaryLogoSrc = "/val-logo-dark.png";
const fallbackLogoSrc = "/val-logo-dark-roomy.png";

export function LogoMark({
  className,
  preload = false,
  sizes = "(max-width: 640px) 48px, 96px",
}: LogoMarkProps) {
  const [source, setSource] = useState(primaryLogoSrc);
  const [showFallbackBadge, setShowFallbackBadge] = useState(false);

  const handleError = () => {
    if (source !== fallbackLogoSrc) {
      setSource(fallbackLogoSrc);
      return;
    }

    setShowFallbackBadge(true);
  };

  return (
    <span
      aria-hidden="true"
      className={cn("relative block overflow-hidden", className)}
    >
      {showFallbackBadge ? (
        <span className="flex h-full w-full items-center justify-center rounded-[inherit] bg-[#050608] text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <span className="pl-[0.2em] text-[10px] font-semibold uppercase tracking-[0.2em]">
            VAL
          </span>
        </span>
      ) : (
        <>
          {/* Use the source PNG directly so the brand mark is not transformed by image optimization. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={source}
            alt=""
            className="brand-logo-image h-full w-full object-contain"
            decoding="async"
            draggable={false}
            fetchPriority={preload ? "high" : "auto"}
            loading={preload ? "eager" : "lazy"}
            onError={handleError}
            sizes={sizes}
            src={source}
          />
        </>
      )}
    </span>
  );
}
