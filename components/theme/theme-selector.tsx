"use client";

import { useDoshabTheme } from "@/components/theme/use-doshab-theme";
import { DOSHAB_PALETTES, getDoshabThemeId, getValThemeAccent } from "@/lib/themes";

export function ThemeSelector() {
  const { error, mode, paletteId, setMode, setPaletteId } = useDoshabTheme();
  return <section className="val-theme-settings grid min-w-0 gap-4" aria-label="Color themes">
    <div>
      <h3 className="text-lg font-semibold">Color themes</h3>
      <p className="mt-1 text-sm text-slate-400">10 palettes. Your choice is saved on this device.</p>
    </div>
    <div className="flex gap-2" role="group" aria-label="Theme mode">
      {(["dark", "light"] as const).map(option => <button type="button" key={option} aria-pressed={mode === option} onClick={() => setMode(option)} className={`${mode === option ? "app-button-primary" : "app-button-secondary"} min-h-11 px-4 text-sm font-semibold`}>{option === "dark" ? "Dark" : "Light"}</button>)}
    </div>
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Theme palette">
      {DOSHAB_PALETTES.map(palette => {
        const { accent } = getValThemeAccent(getDoshabThemeId(palette.id, mode));
        return <button type="button" key={palette.id} aria-pressed={palette.id === paletteId} onClick={() => setPaletteId(palette.id)} className="val-palette-choice">
          <span aria-hidden="true" className="val-palette-swatch" style={{ backgroundColor: accent }} />
          <span>{palette.name}</span>
          {palette.id === paletteId && <span className="val-palette-check" aria-hidden="true">✓</span>}
        </button>;
      })}
    </div>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  </section>;
}
