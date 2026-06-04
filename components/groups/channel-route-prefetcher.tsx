"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ChannelRoutePrefetcherProps = {
  hrefs: string[];
};

export function ChannelRoutePrefetcher({ hrefs }: ChannelRoutePrefetcherProps) {
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      Array.from(new Set(hrefs)).forEach((href) => {
        router.prefetch(href);
      });
    }, 120);

    return () => window.clearTimeout(timer);
  }, [hrefs, router]);

  return null;
}
