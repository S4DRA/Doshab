import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
  preload?: boolean;
  sizes?: string;
};

export function LogoMark({
  className,
  preload = false,
  sizes = "(max-width: 640px) 48px, 96px",
}: LogoMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={cn("relative block overflow-hidden", className)}
    >
      {/* Use the source PNG directly so the brand mark is not transformed by image optimization. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        className="brand-logo-image h-full w-full object-contain"
        decoding="async"
        draggable={false}
        fetchPriority={preload ? "high" : "auto"}
        loading={preload ? "eager" : "lazy"}
        sizes={sizes}
        src="/doshab-logo-transparent.png"
      />
    </span>
  );
}
