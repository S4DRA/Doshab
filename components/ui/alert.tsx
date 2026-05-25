import { cn } from "@/lib/utils";

type AlertProps = {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "error";
};

export function Alert({ children, tone = "neutral" }: AlertProps) {
  return (
    <p
      className={cn(
        "rounded-md border px-4 py-3 text-sm",
        tone === "neutral" && "border-white/10 bg-white/[0.04] text-slate-300",
        tone === "success" &&
          "border-emerald-400/20 bg-emerald-500/10 text-emerald-200",
        tone === "error" && "border-red-400/20 bg-red-500/10 text-red-200",
      )}
    >
      {children}
    </p>
  );
}
