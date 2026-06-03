import { cn } from "@/lib/utils";

type AlertProps = {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "error" | "warning";
};

export function Alert({ children, tone = "neutral" }: AlertProps) {
  const icon =
    tone === "success" ? "✓" : tone === "error" ? "!" : tone === "warning" ? "!" : "i";

  return (
    <div
      aria-live={tone === "neutral" ? "polite" : "assertive"}
      className={cn(
        "flex items-start gap-3 rounded-md border px-4 py-3 text-sm leading-6",
        tone === "neutral" && "border-white/10 bg-white/[0.04] text-slate-300",
        tone === "success" &&
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
        tone === "error" && "border-red-400/20 bg-red-500/10 text-red-200",
        tone === "warning" && "border-amber-300/25 bg-amber-400/10 text-amber-200",
      )}
      role={tone === "neutral" ? "status" : "alert"}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border text-[11px] font-black",
          tone === "neutral" && "border-white/15 text-slate-200",
          tone === "success" && "border-emerald-300/30 text-emerald-100",
          tone === "error" && "border-red-300/35 text-red-100",
          tone === "warning" && "border-amber-200/35 text-amber-100",
        )}
      >
        {icon}
      </span>
      <p className="min-w-0">{children}</p>
    </div>
  );
}
