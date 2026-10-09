import type { HapticRole, OperationPhase, SoundRole } from "./types";

export type SemanticFeedbackEvent = Readonly<{
  // Ephemeral owner-created identities; never message text, account details or media.
  operationId: string;
  eventId: string;
  entityId?: string;
  event: "selection" | "press" | "release" | "local-open" | "mute" | "room-ready" | "warning" | "failure";
  phase: OperationPhase;
  authority: "local-control" | "storage" | "server" | "capture" | "connection";
  soundRole?: SoundRole;
  hapticRole?: HapticRole;
  policy: "silent" | "respect-preferences-and-capabilities";
}>;

export type FeedbackSink = (event: SemanticFeedbackEvent) => void;

/**
 * Deliberate no-op: no storage, timers, logging, platform APIs or media ownership.
 * The authoritative owner emits once at the state transition using a stable eventId.
 * This contract does not promise deduplication or delivery; future sinks must define it.
 */
export const emitInteractionFeedback: FeedbackSink = () => {};
