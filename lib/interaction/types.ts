export type CalibrationStatus = "EXISTING_BASELINE" | "CALIBRATED" | "PROPOSED_UNCALIBRATED";
export type MaterialFamily = "LIGHT" | "STANDARD" | "STRUCTURAL" | "HEAVY" | "CRITICAL";
export type SoundRole = "none" | "detent" | "latch" | "structural-join" | "warning" | "failure";
export type HapticRole = "none" | "selection" | "commit" | "warning" | "failure";

export interface MaterialProperties {
  mass: MaterialFamily;
  stiffness: "bounded";
  damping: "not-applicable" | "critical-rest" | "legacy-sampled-underdamped";
  friction: "minimal" | "normal" | "deliberate" | "confirm";
  activationThreshold: "native-click" | "existing-surface-action" | "explicit-control" | "explicit-confirmation";
  travel: "existing-control" | "recipe-specific";
  snap: "origin" | "existing-destination";
  momentum: "none";
  reversibility: "cancel-before-commit" | "local-reversal" | "interruptible" | "operation-specific" | "irreversible-after-authority";
  latencyBehavior: "immediate-acknowledgement";
  failureBehavior: "preserve-context" | "retain-session" | "preserve-context-no-auto-retry";
  soundRole: SoundRole;
  hapticRole: HapticRole;
}

export type InteractionPhase = "idle" | "focused" | "pressed" | "observing" | "engaged" | "settling";
export type OperationPhase = "intent" | "pending" | "confirmed" | "failed" | "cancelled" | "unknown";
export type RecipeName = "control.standard" | "control.light" | "surface.structural" | "state.press" | "state.release";

export interface InteractionRecipe {
  family: MaterialFamily;
  status: CalibrationStatus;
  purpose: string;
  // Descriptive only. Resolution never schedules or commits an operation.
  activation: "native-click" | "existing-owner";
  materialOverride?: { properties: Partial<MaterialProperties>; reason: string };
  motion: "dashboard-control" | "existing-owner";
}

export interface InteractionPreferences { reducedMotion: boolean }
export type InteractionStyle = Record<`--interaction-${string}`, string>;
