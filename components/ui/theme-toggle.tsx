"use client";

import { DOSHAB_THEMES, getDoshabTheme } from "@/lib/themes";
import { useDoshabTheme } from "@/components/theme/use-doshab-theme";

export function ThemeToggle() {
  const { setThemeId, themeId } = useDoshabTheme();
  const theme = getDoshabTheme(themeId);
  const currentThemeIndex = DOSHAB_THEMES.findIndex((item) => item.id === theme.id);
  const nextTheme = DOSHAB_THEMES[(currentThemeIndex + 1) % DOSHAB_THEMES.length];

  return (
    <button
      aria-label={`Switch to ${nextTheme.name}`}
      className="theme-toggle inline-flex h-8 items-center justify-center rounded-full border px-2 text-[11px] font-semibold transition"
      onClick={() => {
        setThemeId(nextTheme.id);
      }}
      type="button"
      title={`Theme: ${theme.name}`}
    >
      <span className="theme-toggle-dot" />
      <span className="theme-toggle-label">{theme.shortName}</span>
    </button>
  );
}
