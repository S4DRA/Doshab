import { z } from "zod";
import type { MaterialProperties } from "./types";

const status = z.enum(["EXISTING_BASELINE", "CALIBRATED", "PROPOSED_UNCALIBRATED"]);
const source = z.string().min(1);
const provenance = { status, source };
const materialProperties: z.ZodType<MaterialProperties> = z.strictObject({
  mass: z.enum(["LIGHT", "STANDARD", "STRUCTURAL", "HEAVY", "CRITICAL"]),
  stiffness: z.literal("bounded"),
  damping: z.enum(["not-applicable", "critical-rest", "legacy-sampled-underdamped"]),
  friction: z.enum(["minimal", "normal", "deliberate", "confirm"]),
  activationThreshold: z.enum(["native-click", "existing-surface-action", "explicit-control", "explicit-confirmation"]),
  travel: z.enum(["existing-control", "recipe-specific"]), snap: z.enum(["origin", "existing-destination"]),
  momentum: z.literal("none"),
  reversibility: z.enum(["cancel-before-commit", "local-reversal", "interruptible", "operation-specific", "irreversible-after-authority"]),
  latencyBehavior: z.literal("immediate-acknowledgement"),
  failureBehavior: z.enum(["preserve-context", "retain-session", "preserve-context-no-auto-retry"]),
  soundRole: z.enum(["none", "detent", "latch", "structural-join", "warning", "failure"]),
  hapticRole: z.enum(["none", "selection", "commit", "warning", "failure"]),
});
const numeric = (unit: "ms" | "css-px") => z.strictObject({ ...provenance, unit: z.literal(unit), value: z.number().finite().nonnegative(), note: source });
const family = z.strictObject({ ...provenance, extends: z.literal("STANDARD").optional(), properties: z.record(z.string(), z.unknown()) });
const schema = z.strictObject({
  values: z.strictObject({
    "motion.response.dashboardState": numeric("ms"), "motion.response.sharedState": numeric("ms"),
    "motion.response.railState": numeric("ms"),
    "motion.response.controlEasing": z.strictObject({ ...provenance, unit: z.literal("css-easing"), value: z.literal("ease"), note: source }),
    "motion.structural.legacySheetEnter": numeric("ms"), "motion.travel.legacySheetEnter": numeric("css-px"),
  }),
  material: z.strictObject({ STANDARD: family, LIGHT: family, STRUCTURAL: family, HEAVY: family, CRITICAL: family }),
  accessibility: z.strictObject({ reducedMotion: z.strictObject({ ...provenance, note: source, value: z.strictObject({
    transition: z.literal("none"), transform: z.literal("none"), scrollBehavior: z.literal("auto"),
    settle: z.literal("immediate"), loops: z.literal("static"), directManipulation: z.literal("track"),
  }) }) }),
  feedback: z.strictObject({
    soundRole: z.strictObject({ ...provenance, value: z.array(z.enum(["none", "detent", "latch", "structural-join", "warning", "failure"])) }),
    hapticRole: z.strictObject({ ...provenance, value: z.array(z.enum(["none", "selection", "commit", "warning", "failure"])) }),
  }),
  state: z.strictObject({ localOpen: z.strictObject({ ...provenance, value: z.strictObject({
    authority: z.literal("local-state"), activation: z.literal("native-click"), scheduling: z.literal("independent-of-motion"), failure: z.literal("preserve-context"),
  }) }) }),
});

/** Fail closed on incomplete families, cyclic inheritance, unit drift and invalid values. */
export function validateInteractionTokens(input: unknown) {
  const data = schema.parse(input);
  if (data.material.STANDARD.extends) throw new Error("STANDARD cannot inherit");
  const materials = Object.fromEntries(Object.entries(data.material).map(([name, definition]) => {
    if (name !== "STANDARD" && definition.extends !== "STANDARD") throw new Error(`${name} must inherit STANDARD`);
    const properties = materialProperties.parse({ ...data.material.STANDARD.properties, ...definition.properties });
    if (properties.mass !== name) throw new Error(`${name} has a mismatched mass`);
    return [name, { ...definition, properties }];
  }));
  // All keys above are required by the strict schema and all properties parsed.
  return { ...data, material: materials as Record<keyof typeof data.material, { status: z.infer<typeof status>; source: string; properties: MaterialProperties }> };
}
