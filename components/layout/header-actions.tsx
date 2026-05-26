import { ThemeToggle } from "@/components/ui/theme-toggle";

export function HeaderActions() {
  return (
    <div className="flex items-center justify-end gap-3">
      <ThemeToggle />
    </div>
  );
}
