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
      role="status"
      className={cn("val-loader", size === "sm" && "val-loader-compact", className)}
    >
      <div className="val-loader-brand" aria-hidden="true">
        <LogoMark
          className="val-loader-logo"
          preload={size === "lg"}
          sizes={size === "sm" ? "64px" : "88px"}
        />
        <span>VAL<small>A more human internet</small></span>
      </div>
      <div className="val-loader-track" aria-hidden="true"><span /></div>
      <p className="val-loader-label">{label}<span aria-hidden="true">Please wait</span></p>
    </section>
  );
}
