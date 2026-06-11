"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  preload?: boolean;
  sizes?: string;
};

const primaryLogoSrc = "/val-icon-192.png";
const primaryLogoSrcSet = "/val-icon-192.png 192w, /val-icon-512.png 512w";
const fallbackLogoSrc = "/val-icon-512.png";
const legacyFallbackLogoSrc = "/val-logo-dark-roomy.png";

export function LogoMark({
  className,
  preload = false,
  sizes = "(max-width: 640px) 48px, 96px",
}: LogoMarkProps) {
  const [source, setSource] = useState(primaryLogoSrc);
  const [showFallbackBadge, setShowFallbackBadge] = useState(false);

  const handleError = () => {
    if (source === primaryLogoSrc) {
      setSource(fallbackLogoSrc);
      return;
    }

    if (source === fallbackLogoSrc) {
      setSource(legacyFallbackLogoSrc);
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
            height={512}
            loading={preload ? "eager" : "lazy"}
            onError={handleError}
            sizes={sizes}
            src={source}
            srcSet={source === primaryLogoSrc ? primaryLogoSrcSet : undefined}
            width={512}
          />
        </>
      )}
    </span>
  );
}
