import rawTokens from "./tokens.json";
import type { InteractionPreferences, InteractionRecipe, InteractionStyle, MaterialFamily, RecipeName } from "./types";
import { validateInteractionTokens } from "./validation";

const tokens = validateInteractionTokens(rawTokens);
const standard = {
  family: "STANDARD", status: "EXISTING_BASELINE", purpose: "Existing dashboard control response; no action delay.",
  activation: "native-click", motion: "dashboard-control",
} as const satisfies InteractionRecipe;

const recipes = {
  "control.standard": standard,
  "control.light": { family: "LIGHT", status: "PROPOSED_UNCALIBRATED", purpose: "Native selection; retain its owner's current response until migrated.", activation: "native-click", motion: "existing-owner" },
  "surface.structural": {
    family: "STRUCTURAL", status: "PROPOSED_UNCALIBRATED", purpose: "Surface continuity with existing focus/history ownership; not a shipped sheet recipe.",
    activation: "existing-owner", motion: "existing-owner",
  },
  "state.press": { ...standard, purpose: "Visual acknowledgement only; native click remains the commit boundary." },
  "state.release": { ...standard, purpose: "Existing finite return transition; never a completion callback." },
} satisfies Record<RecipeName, InteractionRecipe>;

export function resolveMaterial(family: MaterialFamily) {
  const definition = tokens.material[family];
  return { ...definition, properties: { ...definition.properties } };
}

export function resolveRecipe(name: RecipeName, preferences: InteractionPreferences = { reducedMotion: false }) {
  const recipe: InteractionRecipe = recipes[name];
  const material = resolveMaterial(recipe.family);
  return {
    ...recipe,
    material: { ...material.properties, ...recipe.materialOverride?.properties },
    materialStatus: material.status,
    response: recipe.motion === "dashboard-control" ? {
      duration: { ...tokens.values["motion.response.dashboardState"] },
      easing: { ...tokens.values["motion.response.controlEasing"] },
    } : null,
    reducedMotion: preferences.reducedMotion ? { ...tokens.accessibility.reducedMotion.value } : null,
  };
}

/** SSR-safe custom properties: JSON is the only numeric source; CSS owns media queries. */
export function getControlInteractionStyle(name: "control.standard"): InteractionStyle {
  const recipe = resolveRecipe(name);
  if (!recipe.response || [recipe.response.duration, recipe.response.easing].some((token) => token.status === "PROPOSED_UNCALIBRATED")) {
    throw new Error("A control requires an established response baseline");
  }
  return {
    "--interaction-state-duration": `${recipe.response.duration.value}${recipe.response.duration.unit}`,
    "--interaction-state-easing": recipe.response.easing.value,
    "--interaction-reduced-transition": tokens.accessibility.reducedMotion.value.transition,
    "--interaction-reduced-transform": tokens.accessibility.reducedMotion.value.transform,
  };
}

/** Explicit JS scroll callers must opt in; no existing scrolling is changed in Phase 1. */
export function resolveInteractionScrollBehavior(preferences: InteractionPreferences, requested: ScrollBehavior): ScrollBehavior {
  return preferences.reducedMotion ? tokens.accessibility.reducedMotion.value.scrollBehavior : requested;
}
