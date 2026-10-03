"use client";

import { useLinkStatus } from "next/link";

export function NavigationPending() {
  const { pending } = useLinkStatus();
  return <span className="val-navigation-pending" data-pending={pending} aria-hidden="true" />;
}
