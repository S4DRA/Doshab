"use client";

import { DOSHAB_THEME_MODES, getDoshabTheme } from "@/lib/themes";
import { useDoshabTheme } from "@/components/theme/use-doshab-theme";

type ThemeToggleProps = {
  className?: string;
  variant?: "inline" | "mobile" | "sidebar";
};

export function ThemeToggle({
  className = "",
  variant = "inline",
}: ThemeToggleProps) {
  const { mode, setMode, themeId } = useDoshabTheme();
  const theme = getDoshabTheme(themeId);

  return (
    <div
      aria-label={`Theme mode. Current mode: ${theme.name}`}
      className={`theme-toggle theme-toggle-${variant}${className ? ` ${className}` : ""}`}
      role="group"
      title={`Theme: ${theme.name}`}
    >
      {DOSHAB_THEME_MODES.map((item) => {
        const active = item === mode;
        const label = item === "dark" ? "Dark" : "Light";

        return (
          <button
            aria-pressed={active}
            className="theme-toggle-segment"
            data-active={active ? "true" : "false"}
            data-theme-option={item}
            key={item}
            onClick={() => {
              setMode(item);
            }}
            title={active ? `${label} mode active` : `Switch to ${label} mode`}
            type="button"
          >
            <span aria-hidden="true" className="theme-toggle-segment-swatch" />
            <span className="theme-toggle-segment-copy">
              <span className="theme-toggle-segment-title">{label}</span>
              <span className="theme-toggle-segment-state">{active ? "Active" : "Use"}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
