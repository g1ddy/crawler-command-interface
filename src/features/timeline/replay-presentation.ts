import type {
  CrawlerEvent,
  FloorSegment,
  ProjectedCountdownState,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
  TimelineCountdown,
  TimelineObservation,
} from "../../../app/domain/types.ts";
import { getFloorEndSequence } from "../../../app/domain/floors.ts";
import { projectCountdownState } from "../../../app/domain/countdowns.ts";

export type ReplayMode = "live" | "replay";

export interface ReplayScope {
  availableFloors: FloorSegment[];
  selectedFloorOrdinal: number | "all";
  currentFloorSegment: FloorSegment | null;
  currentFloorIndex: number;
  floorEvents: CrawlerEvent[];
  floorObservations: TimelineObservation[];
  scopedSequences: number[];
  minSequence: number;
  maxSequence: number;
  previousFloorOrdinal: number | null;
  nextFloorOrdinal: number | null;
}

export interface ReplayPosition {
  selectedSequence: number;
  currentIndex: number;
  currentEvent?: CrawlerEvent;
  previousSequence: number | null;
  nextSequence: number | null;
  closestSequence: (targetSequence: number) => number;
}

export interface ReplayCommands {
  canSelectPreviousFloor: boolean;
  canSelectNextFloor: boolean;
  canStepPrevious: boolean;
  canStepNext: boolean;
  canReturnToLive: boolean;
  canToggleLive: boolean;
}

export interface ReplayCountdowns {
  activeCountdown: ProjectedCountdownState | null;
  secondaryCountdowns: ProjectedCountdownState[];
  hasActiveCountdown: boolean;
  hasSecondaryCountdowns: boolean;
}

export interface ReplayInspection {
  hasCountdownEvidence: boolean;
  hasFloorRules: boolean;
  hasTimelineHistory: boolean;
  hasTimelineEvidence: boolean;
}

export interface ReplayAvailability {
  hasEvents: boolean;
  hasFloorEvents: boolean;
  hasScopedSequences: boolean;
}

export interface ReplayPresentation {
  mode: ReplayMode;
  isLive: boolean;
  scope: ReplayScope;
  position: ReplayPosition;
  commands: ReplayCommands;
  countdowns: ReplayCountdowns;
  inspection: ReplayInspection;
  availability: ReplayAvailability;
}

export interface ReplayPresentationInputs {
  events?: CrawlerEvent[];
  floors?: FloorSegment[];
  countdowns?: TimelineCountdown[];
  observations?: TimelineObservation[];
  selectedFloorOrdinal: number | "all";
  selectedSequence: number;
  isLive: boolean;
}

export interface ReplayCommandCallbacks {
  selectFloor: (ordinal: number | "all") => void;
  selectSequence: (sequence: number) => void;
  stepPrevious: () => void;
  stepNext: () => void;
  returnToLive: () => void;
  setLiveMode: (isLive: boolean) => void;
  openFloorRules?: () => void;
  openTimelineHistory?: () => void;
  openTimelineEvidence?: () => void;
  openCountdownEvidence?: () => void;
  inspectObservation?: (
    observation:
      | ProjectedObservationValue
      | ProjectedItemObservation
      | ProjectedEquipmentObservation,
  ) => void;
}

/**
 * Pure, layout-neutral replay presentation selector.
 * Answers "what does this selected replay position mean?" without React or UI assumptions.
 */
export function deriveReplayPresentation(
  inputs: ReplayPresentationInputs,
): ReplayPresentation {
  const events = inputs.events ?? [];
  const floors = inputs.floors ?? [];
  const countdowns = inputs.countdowns ?? [];
  const observations = inputs.observations ?? [];
  const selectedFloorOrdinal = inputs.selectedFloorOrdinal;
  const selectedSequence = inputs.selectedSequence;
  const isLive = inputs.isLive;

  const mode: ReplayMode = isLive ? "live" : "replay";

  const baseFloors =
    floors.length > 0
      ? floors
      : Array.from(
          events.reduce((map, event) => {
            const ordinal = event.position?.floor ?? 1;
            const existing = map.get(ordinal);
            if (existing) {
              existing.endSequence = Math.max(existing.endSequence, event.sequence);
            } else {
              map.set(ordinal, {
                id: `floor-${ordinal}`,
                ordinal,
                title: `Floor ${ordinal}`,
                startSequence: event.sequence,
                endSequence: event.sequence,
              });
            }
            return map;
          }, new Map<number, FloorSegment>()).values(),
        ).sort((a, b) => a.ordinal - b.ordinal);

  const availableFloors = baseFloors.map((floor) => ({
    ...floor,
    endSequence: getFloorEndSequence(events, floor.ordinal, floor.endSequence),
  }));

  const currentFloorIndex =
    selectedFloorOrdinal === "all"
      ? -1
      : availableFloors.findIndex((f) => f.ordinal === selectedFloorOrdinal);

  const currentFloorSegment =
    currentFloorIndex >= 0 ? availableFloors[currentFloorIndex] : null;

  const previousFloorOrdinal =
    selectedFloorOrdinal !== "all" && currentFloorIndex > 0
      ? availableFloors[currentFloorIndex - 1].ordinal
      : null;

  const nextFloorOrdinal =
    selectedFloorOrdinal !== "all" &&
    currentFloorIndex >= 0 &&
    currentFloorIndex < availableFloors.length - 1
      ? availableFloors[currentFloorIndex + 1].ordinal
      : null;

  const floorEvents =
    selectedFloorOrdinal === "all"
      ? events
      : events.filter((e) => e.position?.floor === selectedFloorOrdinal);

  const floorObservations =
    selectedFloorOrdinal === "all"
      ? observations
      : (() => {
          const sequences = new Set(floorEvents.map((e) => e.sequence));
          return observations.filter((obs) => sequences.has(obs.sequence));
        })();

  const scopedSequences = Array.from(
    new Set([
      ...floorEvents.map((e) => e.sequence),
      ...floorObservations.map((o) => o.sequence),
    ]),
  ).sort((a, b) => a - b);

  const minSequence = scopedSequences[0] ?? 1;
  const maxSequence = scopedSequences[scopedSequences.length - 1] ?? 1;

  let currentEvent: CrawlerEvent | undefined;
  for (const event of events) {
    if (event.sequence <= selectedSequence) {
      currentEvent = event;
    } else {
      break;
    }
  }

  let currentIndex = 0;
  for (let i = 0; i < scopedSequences.length; i++) {
    if (scopedSequences[i] <= selectedSequence) {
      currentIndex = i;
    } else {
      break;
    }
  }

  const previousSequence =
    currentIndex > 0 ? scopedSequences[currentIndex - 1] : null;
  const nextSequence =
    currentIndex < scopedSequences.length - 1
      ? scopedSequences[currentIndex + 1]
      : null;

  const closestSequence = (targetSequence: number) => {
    if (scopedSequences.length === 0) return targetSequence;
    return scopedSequences.reduce(
      (best, sequence) =>
        Math.abs(sequence - targetSequence) < Math.abs(best - targetSequence)
          ? sequence
          : best,
      scopedSequences[0] ?? targetSequence,
    );
  };

  const activeCountdown = projectCountdownState(
    { events, countdowns },
    selectedSequence,
    selectedFloorOrdinal,
  );

  const secondaryCountdowns = countdowns
    .filter(
      (countdown) =>
        countdown.target !== "floor-collapse" &&
        (selectedFloorOrdinal === "all" || countdown.floor === selectedFloorOrdinal),
    )
    .map((countdown) =>
      projectCountdownState({ events, countdowns: [countdown] }, selectedSequence, countdown.floor),
    )
    .filter((countdown): countdown is NonNullable<typeof countdown> => countdown !== null);

  const commands: ReplayCommands = {
    canSelectPreviousFloor: previousFloorOrdinal !== null,
    canSelectNextFloor: nextFloorOrdinal !== null,
    canStepPrevious: currentIndex > 0,
    canStepNext: currentIndex < scopedSequences.length - 1,
    canReturnToLive: !isLive,
    canToggleLive: true,
  };

  const inspection: ReplayInspection = {
    hasCountdownEvidence: Boolean(activeCountdown),
    hasFloorRules: floorEvents.length > 0,
    hasTimelineHistory: events.length > 0,
    hasTimelineEvidence: observations.length > 0,
  };

  const availability: ReplayAvailability = {
    hasEvents: events.length > 0,
    hasFloorEvents: floorEvents.length > 0,
    hasScopedSequences: scopedSequences.length > 0,
  };

  return {
    mode,
    isLive,
    scope: {
      availableFloors,
      selectedFloorOrdinal,
      currentFloorSegment,
      currentFloorIndex,
      floorEvents,
      floorObservations,
      scopedSequences,
      minSequence,
      maxSequence,
      previousFloorOrdinal,
      nextFloorOrdinal,
    },
    position: {
      selectedSequence,
      currentIndex,
      currentEvent,
      previousSequence,
      nextSequence,
      closestSequence,
    },
    commands,
    countdowns: {
      activeCountdown,
      secondaryCountdowns,
      hasActiveCountdown: Boolean(activeCountdown),
      hasSecondaryCountdowns: secondaryCountdowns.length > 0,
    },
    inspection,
    availability,
  };
}
