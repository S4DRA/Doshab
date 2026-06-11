import { LogoMark } from "@/components/ui/logo-mark";
import { cn } from "@/lib/utils";

type ValLoadingScreenProps = {
  className?: string;
  label?: string;
  size?: "sm" | "lg";
};

export function ValLoadingScreen({
  className,
  label = "Loading",
  size = "lg",
}: ValLoadingScreenProps) {
  return (
    <section
      aria-busy="true"
      aria-label={label}
      className={cn("doshab-loader grid justify-items-center text-center", className)}
    >
      <div
        aria-hidden="true"
        className={cn("doshab-loader-orbit", size === "sm" && "doshab-loader-orbit-sm")}
      >
        <span className="doshab-loader-halo" />
        <span className="doshab-loader-pulse" />
        <span className="doshab-loader-ring" />
        <span className="doshab-loader-ring doshab-loader-ring-delay" />
        <span className="doshab-loader-ripple doshab-loader-ripple-one" />
        <span className="doshab-loader-ripple doshab-loader-ripple-two" />
        <span className="doshab-loader-particle-track doshab-loader-particle-track-one">
          <span className="doshab-loader-dot" />
        </span>
        <span className="doshab-loader-particle-track doshab-loader-particle-track-two">
          <span className="doshab-loader-dot doshab-loader-dot-secondary" />
        </span>
        <span className="doshab-loader-particle-track doshab-loader-particle-track-three">
          <span className="doshab-loader-dot doshab-loader-dot-tertiary" />
        </span>
        <LogoMark
          className="doshab-loader-logo"
          preload={size === "lg"}
          sizes={size === "sm" ? "112px" : "160px"}
        />
      </div>
      <span className="doshab-loader-eyebrow">VAL</span>
      <p className="doshab-loader-label">{label}</p>
    </section>
  );
}
