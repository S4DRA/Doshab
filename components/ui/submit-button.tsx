"use client";

import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  disabled?: boolean;
  title?: string;
};

export function SubmitButton({
  children,
  disabled = false,
  pendingText = "Working...",
  className,
  title,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isDisabled = pending || disabled;

  return (
    <button
      aria-busy={pending}
      aria-disabled={isDisabled}
      className={cn(
        "rounded-md text-sm font-semibold transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500",
        className,
      )}
      disabled={isDisabled}
      title={title}
      type="submit"
    >
      {pending ? pendingText : children}
    </button>
  );
}
