"use client";

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
};

export function SubmitButton({
  children,
  pendingText = "Working...",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        "rounded-md text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500",
        className,
      )}
      disabled={pending}
      type="submit"
    >
      {pending ? pendingText : children}
    </button>
  );
}
