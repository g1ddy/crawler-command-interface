/** Evidence-aware UI intentionally supported for reuse by other features. */
import React, { type ComponentProps } from "react";
import type { TelemetryBadge as TelemetryBadgeComp } from "./evidence/TelemetryBadge";
import type { SequenceBadge as SequenceBadgeComp } from "./SequenceBadge";

export const TelemetryBadge = (props: ComponentProps<typeof TelemetryBadgeComp>) => {
  const Component = React.lazy(() => import("./evidence/TelemetryBadge.tsx").then(m => ({ default: m.TelemetryBadge })));
  return React.createElement(React.Suspense, { fallback: null }, React.createElement(Component, props));
};

export const SequenceBadge = (props: ComponentProps<typeof SequenceBadgeComp>) => {
  const Component = React.lazy(() => import("./SequenceBadge.tsx").then(m => ({ default: m.SequenceBadge })));
  return React.createElement(React.Suspense, { fallback: null }, React.createElement(Component, props));
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
