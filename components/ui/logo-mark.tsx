import Image from "next/image";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block overflow-hidden", className)}
    >
      <Image
        alt=""
        className="brand-logo-image object-contain mix-blend-screen contrast-150"
        fill
        sizes="64px"
        src="/Doshab_png.png"
      />
    </span>
  );
}
