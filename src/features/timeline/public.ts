/** Framework-neutral feature contracts should remain safe for Node tests, Workers, and selectors. */
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
