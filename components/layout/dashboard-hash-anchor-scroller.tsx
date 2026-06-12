"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

function scrollToCurrentHash() {
  const hash = window.location.hash.replace(/^#/, "");

  if (!hash) {
    return;
  }

  const target = document.getElementById(decodeURIComponent(hash));

  if (!target) {
    return;
  }

  target.scrollIntoView({
    block: "start",
  });
}

export function DashboardHashAnchorScroller() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();

  useEffect(() => {
    const timeoutIds = [0, 120, 360, 720].map((delay) =>
      window.setTimeout(scrollToCurrentHash, delay),
    );

    const frameId = window.requestAnimationFrame(scrollToCurrentHash);

    window.addEventListener("hashchange", scrollToCurrentHash);

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("hashchange", scrollToCurrentHash);
    };
  }, [pathname, searchKey]);

  return null;
}
