import type {
  ActiveCountdownState,
  CountdownReference,
  CrawlerEvent,
  CrawlerTimelineDocument,
  TimelineCountdown,
  TimelineEvent,
} from './types.ts';

export function formatCountdownDuration(
  remainingSeconds: number,
  isEstimated: boolean = false,
  activationOffset?: number,
  lifecycleStatus?: 'scheduled' | 'active' | 'completed'
): string {
  if (lifecycleStatus === 'scheduled' || (activationOffset !== undefined && activationOffset < 0)) {
    const absOffset = Math.abs(activationOffset ?? 0);
    if (absOffset <= 0) {
      return isEstimated ? 'COUNTDOWN STARTS IN ~0s' : 'COUNTDOWN STARTS IN 0s';
    }
    const days = Math.floor(absOffset / 86400);
    const hours = Math.floor((absOffset % 86400) / 3600);
    const mins = Math.floor((absOffset % 3600) / 60);
    const secs = absOffset % 60;

    let formatted = '';
    if (days > 0) {
      formatted = `${days}d ${hours}h`;
    } else if (hours > 0) {
      formatted = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    } else if (mins > 0) {
      formatted = secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
    } else {
      formatted = `${secs}s`;
    }

    return isEstimated ? `COUNTDOWN STARTS IN ~${formatted}` : `COUNTDOWN STARTS IN ${formatted}`;
  }

  if (remainingSeconds <= 0 || lifecycleStatus === 'completed') {
    return isEstimated ? '~0s left' : '0s left';
  }

  const days = Math.floor(remainingSeconds / 86400);
  const hours = Math.floor((remainingSeconds % 86400) / 3600);
  const mins = Math.floor((remainingSeconds % 3600) / 60);

  const secs = remainingSeconds % 60;

  let formatted = '';
  if (days > 0) {
    formatted = `${days}d ${hours}h left`;
  } else if (hours > 0) {
    formatted = mins > 0 ? `${hours}h ${mins}m left` : `${hours}h left`;
  } else if (mins > 0) {
    formatted = secs > 0 ? `${mins}m ${secs}s left` : `${mins}m left`;
  } else {
    formatted = `${secs}s left`;
  }

  return isEstimated ? `~${formatted}` : formatted;
}

/**
 * A phase break makes adjacent countdown observations incomparable. Keep this
 * shared with authoring validation so accepted source data and UI projection
 * follow the same boundary rules.
 */
export function isCountdownPhaseBreakEvent(
  event: { type?: string; countdownId?: string },
  targetCountdownId?: string
): boolean {
  if (!targetCountdownId) {
    return false;
  }
  return (
    (event.type === 'CountdownPaused' ||
      event.type === 'CountdownResumed' ||
      event.type === 'CountdownReset' ||
      event.type === 'CountdownPhaseChanged') &&
    event.countdownId === targetCountdownId
  );
}

function makeCountdownState(
  countdown: TimelineCountdown,
  remainingSeconds: number,
  activationOffset: number | undefined,
  status: 'stated' | 'estimated',
  isStale: boolean,
  basis: ActiveCountdownState['basis'],
  confidence: ActiveCountdownState['confidence'],
  referencePoints: CountdownReference[],
  note?: string
): ActiveCountdownState {
  const lifecycleStatus: 'scheduled' | 'active' | 'completed' =
    activationOffset !== undefined && activationOffset < 0
      ? 'scheduled'
      : remainingSeconds <= 0
      ? 'completed'
      : 'active';

  const isEstimated = status === 'estimated';
  const formattedTime = formatCountdownDuration(remainingSeconds, isEstimated, activationOffset, lifecycleStatus);
  const labelSuffix = isStale
    ? 'stated (latest source)'
    : status === 'estimated'
    ? 'estimated'
    : lifecycleStatus === 'scheduled'
    ? 'scheduled'
    : 'stated';
  const formattedLabel = `${formattedTime} · ${labelSuffix}`;

  return {
    id: countdown.id,
    title: countdown.title,
    floor: countdown.floor,
    target: countdown.target,
    lifecycleStatus,
    remainingSeconds,
    ...(activationOffset !== undefined ? { activationOffset } : {}),
    status,
    isStale,
    basis,
    confidence,
    formattedTime,
    formattedLabel,
    referencePoints,
    note,
  };
}

export function projectCountdownState(
  docOrEvents: CrawlerTimelineDocument | CrawlerEvent[] | { countdowns?: TimelineCountdown[]; events?: CrawlerEvent[] } | unknown,
  targetSequence: number,
  selectedFloorOrdinal?: number | 'all'
): ActiveCountdownState | null {
  let countdowns: TimelineCountdown[] = [];
  let events: (TimelineEvent | CrawlerEvent)[] = [];

  if (docOrEvents && typeof docOrEvents === 'object' && 'schemaVersion' in (docOrEvents as object)) {
    const doc = docOrEvents as CrawlerTimelineDocument;
    countdowns = doc.countdowns || [];
    events = doc.events || [];
  } else if (docOrEvents && typeof docOrEvents === 'object' && 'countdowns' in (docOrEvents as object)) {
    const doc = docOrEvents as { countdowns?: TimelineCountdown[]; events?: (TimelineEvent | CrawlerEvent)[] };
    countdowns = doc.countdowns || [];
    events = doc.events || [];
  } else if (Array.isArray(docOrEvents)) {
    events = docOrEvents;
  }

  if (!countdowns || countdowns.length === 0) {
    return null;
  }

  // Determine active floor ordinal
  let targetFloor = selectedFloorOrdinal;
  if (targetFloor === 'all' || targetFloor === undefined) {
    const targetEv = events.find((e) => e.sequence === targetSequence);
    if (targetEv?.position?.floor) {
      targetFloor = targetEv.position.floor;
    } else {
      // Default to floor of first countdown
      targetFloor = countdowns[0].floor;
    }
  }

  // Find active countdown for targetFloor
  const activeCountdown = countdowns.find((c) => c.floor === targetFloor);
  if (!activeCountdown || !activeCountdown.references || activeCountdown.references.length === 0) {
    return null;
  }

  // Sort references by sequence
  const references = [...activeCountdown.references].sort((a, b) => a.sequence - b.sequence);
  const firstRef = references[0];
  const lastRef = references[references.length - 1];

  // Extrapolate beyond the final reference from the latest compatible pair so
  // replay keeps a continuous countdown through the floor exit.
  if (targetSequence > lastRef.sequence) {
    const laterPhaseBreak = events.some(
      (event) =>
        event.sequence > lastRef.sequence &&
        event.sequence <= targetSequence &&
        isCountdownPhaseBreakEvent(event, activeCountdown.id)
    );
    if (laterPhaseBreak) {
      return null;
    }

    const penultimateRef = references[references.length - 2];
    const lastIsScheduled = lastRef.activationOffset !== undefined && lastRef.activationOffset < 0;
    const penultimateIsScheduled =
      penultimateRef && penultimateRef.activationOffset !== undefined && penultimateRef.activationOffset < 0;

    const isActivePair =
      penultimateRef &&
      !penultimateIsScheduled &&
      !lastIsScheduled &&
      lastRef.remainingSeconds < penultimateRef.remainingSeconds;
    const isScheduledPair =
      penultimateRef &&
      penultimateIsScheduled &&
      lastIsScheduled &&
      lastRef.activationOffset! > penultimateRef.activationOffset!;

    const hasCompatiblePair =
      penultimateRef &&
      (isActivePair || isScheduledPair) &&
      !events
        .filter((event) => event.sequence > penultimateRef.sequence && event.sequence <= lastRef.sequence)
        .some((event) => isCountdownPhaseBreakEvent(event, activeCountdown.id));

    if (hasCompatiblePair) {
      const penultimateEvent = events.find((event) => event.sequence === penultimateRef.sequence);
      const lastEvent = events.find((event) => event.sequence === lastRef.sequence);
      const targetEvent = events.find((event) => event.sequence === targetSequence);
      const penultimateElapsed = penultimateEvent?.position?.elapsedSeconds;
      const lastElapsed = lastEvent?.position?.elapsedSeconds;
      const targetElapsed = targetEvent?.position?.elapsedSeconds;
      const hasElapsedDurations =
        typeof penultimateElapsed === 'number' &&
        typeof lastElapsed === 'number' &&
        typeof targetElapsed === 'number' &&
        lastElapsed > penultimateElapsed;
      const fraction = hasElapsedDurations
        ? (targetElapsed - penultimateElapsed) / (lastElapsed - penultimateElapsed)
        : (targetSequence - penultimateRef.sequence) / (lastRef.sequence - penultimateRef.sequence);
      const remainingSeconds = Math.max(
        0,
        Math.round(penultimateRef.remainingSeconds + fraction * (lastRef.remainingSeconds - penultimateRef.remainingSeconds))
      );
      const basis = hasElapsedDurations ? 'elapsed-duration-extrapolation' : 'sequence-position-extrapolation';

      let interpolatedOffset: number | undefined;
      if (lastRef.activationOffset !== undefined) {
        if (penultimateRef.activationOffset !== undefined) {
          interpolatedOffset = Math.round(
            penultimateRef.activationOffset + fraction * (lastRef.activationOffset - penultimateRef.activationOffset)
          );
        } else {
          interpolatedOffset = lastRef.activationOffset;
        }
      }

      return makeCountdownState(
        activeCountdown,
        remainingSeconds,
        interpolatedOffset,
        'estimated',
        false,
        basis,
        'low-confidence',
        [penultimateRef, lastRef],
        lastRef.note
      );
    }

    // A single reference cannot yield a rate. Retain it as a clearly sourced
    // value rather than pretending an estimate exists.
    const remainingSeconds = lastRef.remainingSeconds;
    const confidence = lastRef.evidence[0]?.confidence || 'confirmed';
    return makeCountdownState(
      activeCountdown,
      remainingSeconds,
      lastRef.activationOffset,
      'stated',
      true,
      'last-known-reference',
      confidence,
      [lastRef],
      lastRef.note
    );
  }

  // 1. Evidence boundary: return null before the first sourced countdown reference
  if (targetSequence < firstRef.sequence) {
    return null;
  }

  // 2. Check exact sequence match
  const exactRef = references.find((r) => r.sequence === targetSequence);
  if (exactRef) {
    const remainingSeconds = exactRef.remainingSeconds;
    const confidence = exactRef.evidence[0]?.confidence || 'confirmed';
    return makeCountdownState(
      activeCountdown,
      remainingSeconds,
      exactRef.activationOffset,
      'stated',
      false,
      'exact-reference',
      confidence,
      [exactRef],
      exactRef.note
    );
  }

  // 3. Find bounding references R1 and R2
  let r1: CountdownReference | null = null;
  let r2: CountdownReference | null = null;

  for (let i = 0; i < references.length - 1; i++) {
    if (references[i].sequence < targetSequence && references[i + 1].sequence > targetSequence) {
      r1 = references[i];
      r2 = references[i + 1];
      break;
    }
  }

  if (!r1 || !r2) {
    return null;
  }

  // Check compatibility:
  // If both references are active, remainingSeconds must decrease.
  // If either reference is scheduled, activationOffset must increase towards activation.
  const r1IsScheduled = r1.activationOffset !== undefined && r1.activationOffset < 0;
  const r2IsScheduled = r2.activationOffset !== undefined && r2.activationOffset < 0;

  if (!r1IsScheduled && !r2IsScheduled) {
    if (r2.remainingSeconds >= r1.remainingSeconds) {
      // Non-monotonic active countdown -> do not interpolate
      return null;
    }
  } else if (r1.activationOffset !== undefined && r2.activationOffset !== undefined) {
    if (r2.activationOffset <= r1.activationOffset) {
      // Scheduled activation offset must increase towards activation
      return null;
    }
  }

  // Check if events between r1 and r2 contain countdown pause/resume/reset/phase change events
  const intermediateEvents = events.filter((e) => e.sequence > r1!.sequence && e.sequence <= r2!.sequence);
  const hasPhaseBreak = intermediateEvents.some((e) => isCountdownPhaseBreakEvent(e, activeCountdown.id));

  if (hasPhaseBreak) {
    return null;
  }

  // Find corresponding events for r1, r2, and targetSequence
  const ev1 = events.find((e) => e.sequence === r1!.sequence);
  const ev2 = events.find((e) => e.sequence === r2!.sequence);
  const evTarget = events.find((e) => e.sequence === targetSequence);

  const dur1 = ev1?.position?.elapsedSeconds;
  const dur2 = ev2?.position?.elapsedSeconds;
  const durTarget = evTarget?.position?.elapsedSeconds;

  let interpolatedSeconds = 0;
  let interpolatedOffset: number | undefined;
  let basis: 'elapsed-duration' | 'sequence-position' = 'sequence-position';
  let confidence: ActiveCountdownState['confidence'] = 'low-confidence';

  const hasElapsedBasis =
    typeof dur1 === 'number' &&
    typeof dur2 === 'number' &&
    typeof durTarget === 'number' &&
    dur2 > dur1 &&
    durTarget >= dur1 &&
    durTarget <= dur2;

  const fraction = hasElapsedBasis
    ? (durTarget - dur1) / (dur2 - dur1)
    : (targetSequence - r1.sequence) / (r2.sequence - r1.sequence);

  interpolatedSeconds = Math.round(r1.remainingSeconds + fraction * (r2.remainingSeconds - r1.remainingSeconds));

  if (r1.activationOffset !== undefined && r2.activationOffset !== undefined) {
    interpolatedOffset = Math.round(r1.activationOffset + fraction * (r2.activationOffset - r1.activationOffset));
  } else if (r1.activationOffset !== undefined) {
    interpolatedOffset = Math.round(r1.activationOffset + fraction * (0 - r1.activationOffset));
  }

  basis = hasElapsedBasis ? 'elapsed-duration' : 'sequence-position';
  confidence = hasElapsedBasis ? (r1.evidence[0]?.confidence || 'confirmed') : 'low-confidence';

  return makeCountdownState(
    activeCountdown,
    interpolatedSeconds,
    interpolatedOffset,
    'estimated',
    false,
    basis,
    confidence,
    [r1, r2],
    r1.note || r2.note
  );
}
