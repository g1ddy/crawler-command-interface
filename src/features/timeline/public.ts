/** Evidence-aware UI intentionally supported for reuse by other features. */
import React, { type ComponentProps } from "react";
import type { TelemetryBadge as TelemetryBadgeComp } from "./evidence/TelemetryBadge";
import type { SequenceBadge as SequenceBadgeComp } from "./SequenceBadge";

const LazyTelemetryBadge = React.lazy(() => import("./evidence/TelemetryBadge.tsx").then(m => ({ default: m.TelemetryBadge })));
export const TelemetryBadge = (props: ComponentProps<typeof TelemetryBadgeComp>) => {
  return React.createElement(React.Suspense, { fallback: null }, React.createElement(LazyTelemetryBadge, props));
};

const LazySequenceBadge = React.lazy(() => import("./SequenceBadge.tsx").then(m => ({ default: m.SequenceBadge })));
export const SequenceBadge = (props: ComponentProps<typeof SequenceBadgeComp>) => {
  return React.createElement(React.Suspense, { fallback: null }, React.createElement(LazySequenceBadge, props));
};
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
