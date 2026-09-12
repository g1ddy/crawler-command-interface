/** Evidence-aware UI intentionally supported for reuse by other features. */
export { TelemetryBadge } from "./evidence/TelemetryBadge";
export { SequenceBadge } from "./SequenceBadge";
export {
  deriveEvidencePresentation,
  displayedReadingAuthority,
  selectDisplayedReading,
  type DisplayAuthority,
  type EvidencePresentation,
  type EvidenceState,
} from "./evidence/evidencePresentation.ts";
export {
  deriveReplayPresentation,
  type ReplayAvailability,
  type ReplayCommandCallbacks,
  type ReplayCommands,
  type ReplayCountdowns,
  type ReplayInspection,
  type ReplayMode,
  type ReplayPosition,
  type ReplayPresentation,
  type ReplayPresentationInputs,
  type ReplayScope,
} from "./replay-presentation.ts";
