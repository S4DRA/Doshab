"use client";

import { defaultMobileNavbar, mobileNavbarButtons, mobileNavbarPositions } from "@/lib/mobile-navbar";
import { useMobileNavbarPreferences } from "./mobile-navbar-preferences";
import { MobileIcon } from "./mobile-ui";

/** The only editor for the mobile navbar; mounted exclusively inside mobile Settings. */
export function MobileNavbarSettings() {
  const { preferences, ready, error, update } = useMobileNavbarPreferences();
  return <div className="val-navbar-settings">
    <div><h2>Navigation bar</h2><p>Choose your buttons and where they sit. Changes apply immediately to this account on this device.</p></div>
    <fieldset disabled={!ready}>
      <legend>Position</legend>
      <div className="val-navbar-position-options">{mobileNavbarPositions.map(position => <label key={position}>
        <input type="radio" name="navbar-position" value={position} checked={preferences.position === position} onChange={() => update({ ...preferences, position, floating: position === "bottom" && preferences.floating })} />
        <span>{position[0].toUpperCase() + position.slice(1)}</span>
      </label>)}</div>
    </fieldset>
    <label className="val-navbar-floating-option">
      <span><strong>Floating navbar</strong><small>Available at the bottom only.</small></span>
      <input type="checkbox" aria-label="Floating navbar" disabled={!ready || preferences.position !== "bottom"} checked={preferences.floating} onChange={event => update({ ...preferences, floating: event.target.checked })} />
    </label>
    <fieldset disabled={!ready}>
      <legend>Buttons</legend>
      <p>Buttons become more compact as you add them. Settings stays available when Profile is hidden.</p>
      <div className="val-navbar-button-options">{mobileNavbarButtons.map(button => <label key={button.id}>
        <MobileIcon name={button.icon} /><span>{button.label}</span>
        <input type="checkbox" aria-label={`Show ${button.label} in navbar`} checked={preferences.buttons.includes(button.id)} onChange={event => update({ ...preferences, buttons: event.target.checked ? [...preferences.buttons, button.id] : preferences.buttons.filter(id => id !== button.id) })} />
      </label>)}</div>
    </fieldset>
    {preferences.buttons.length === 0 && <p>The navbar is hidden. Use the VAL logo to return Home and the Settings button to customize it again.</p>}
    <button type="button" className="app-button-secondary" disabled={!ready} onClick={() => update(defaultMobileNavbar)}>Restore default navbar</button>
    <p role="status" className={error ? "val-navbar-warning" : "val-navbar-save-status"}>{error ?? (ready ? "Changes save on this device." : "Reading your navbar preferences…")}</p>
  </div>;
}
