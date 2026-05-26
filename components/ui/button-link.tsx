import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className,
}: ButtonLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#FF5F25] focus:ring-offset-2 focus:ring-offset-[#070a12]",
        variant === "primary" &&
          "bg-[#FF5F25] text-white shadow-lg shadow-[#FF5F25]/40 hover:bg-[#FF5F25]/90",
        variant === "secondary" &&
          "border border-white/12 bg-white/7 text-slate-100 hover:bg-white/12",
        className,
      )}
    >
      {children}
    </Link>
  );
}
