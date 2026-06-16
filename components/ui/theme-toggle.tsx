"use client";

import { DOSHAB_THEMES, getDoshabTheme } from "@/lib/themes";
import { useDoshabTheme } from "@/components/theme/use-doshab-theme";

type ThemeToggleProps = {
  className?: string;
  variant?: "inline" | "mobile" | "sidebar";
};

export function ThemeToggle({
  className = "",
  variant = "inline",
}: ThemeToggleProps) {
  const { setThemeId, themeId } = useDoshabTheme();
  const theme = getDoshabTheme(themeId);

  return (
    <div
      aria-label={`Theme mode. Current mode: ${theme.name}`}
      className={`theme-toggle theme-toggle-${variant}${className ? ` ${className}` : ""}`}
      role="group"
      title={`Theme: ${theme.name}`}
    >
      {DOSHAB_THEMES.map((item) => {
        const active = item.id === theme.id;

        return (
          <button
            aria-pressed={active}
            className="theme-toggle-segment"
            data-active={active ? "true" : "false"}
            data-theme-option={item.id}
            key={item.id}
            onClick={() => {
              setThemeId(item.id);
            }}
            title={active ? `${item.name} active` : `Switch to ${item.name}`}
            type="button"
          >
            <span aria-hidden="true" className="theme-toggle-segment-swatch" />
            <span className="theme-toggle-segment-copy">
              <span className="theme-toggle-segment-title">{item.shortName}</span>
              <span className="theme-toggle-segment-state">{active ? "Active" : "Use"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
