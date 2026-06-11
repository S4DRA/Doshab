"use client";

import { useState } from "react";

import { getInitials } from "@/lib/utils";
import { LogoMark } from "@/components/ui/logo-mark";

type AvatarInitialsProps = {
  fallback?: "group" | "initials" | "person";
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  value: string;
};

const sizeClasses = {
  sm: "size-9 text-xs",
  md: "size-10 text-sm",
  lg: "size-20 text-xl",
};

export function AvatarInitials({
  fallback = "person",
  imageUrl,
  size = "md",
  value,
}: AvatarInitialsProps) {
  const className = `${sizeClasses[size]} theme-avatar grid shrink-0 place-items-center overflow-hidden rounded-lg font-bold`;
  const normalizedImageUrl = normalizeImageUrl(imageUrl);
  const [failedImageUrl, setFailedImageUrl] = useState<string | null>(null);
  const showImage = Boolean(normalizedImageUrl && normalizedImageUrl !== failedImageUrl);

  if (normalizedImageUrl && showImage) {
    return (
      <span className={className}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt=""
          className="size-full object-cover"
          onError={() => setFailedImageUrl(normalizedImageUrl)}
          referrerPolicy="no-referrer"
          src={normalizedImageUrl}
        />
      </span>
    );
  }

  if (fallback === "group") {
    return (
      <span className={`${className} theme-avatar-group`} title={value}>
        <LogoMark
          className="h-[72%] w-[72%] opacity-55"
          sizes={size === "lg" ? "80px" : "48px"}
        />
        <span className="sr-only">{value}</span>
      </span>
    );
  }

  if (fallback === "person") {
    return (
      <span className={`${className} theme-avatar-person`} title={value}>
        <PersonIcon className={size === "lg" ? "h-9 w-9" : "h-5 w-5"} />
        <span className="sr-only">{value}</span>
      </span>
    );
  }

  return (
    <span className={`${className} theme-avatar-initials`} title={value}>
      {getInitials(value)}
    </span>
  );
}

function normalizeImageUrl(imageUrl?: string | null) {
  const value = imageUrl?.trim();

  if (!value) {
    return null;
  }

  if (value.startsWith("data:image/") || value.startsWith("blob:")) {
    return value;
  }

  try {
    const url = new URL(value, "https://val.local");

    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function PersonIcon({ className }: { className: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </svg>
  );
}
