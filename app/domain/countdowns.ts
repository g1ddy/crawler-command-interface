import type {
  ActiveCountdownState,
  CountdownReference,
  CrawlerEvent,
  CrawlerTimelineDocument,
  TimelineCountdown,
  TimelineEvent,
} from './types.ts';

export function formatCountdownDuration(remainingSeconds: number, isEstimated: boolean = false): string {
  if (remainingSeconds <= 0) {
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
export function isCountdownPhaseBreakEvent(event: { summary?: string; type?: string }): boolean {
  const summary = event.summary?.toLowerCase() || '';
  return (
    summary.includes('countdown paused') ||
    summary.includes('countdown resumed') ||
    summary.includes('countdown reset') ||
    summary.includes('phase change') ||
    event.type === 'CountdownPaused' ||
    event.type === 'CountdownResumed' ||
    event.type === 'CountdownReset' ||
    event.type === 'CountdownPhaseChanged'
  );
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

  // Do not extrapolate before the first or after the last reference
  if (targetSequence < firstRef.sequence || targetSequence > lastRef.sequence) {
    return null;
  }

  // 1. Check exact sequence match
  const exactRef = references.find((r) => r.sequence === targetSequence);
  if (exactRef) {
    const remainingSeconds = exactRef.remainingSeconds;
    const formattedTime = formatCountdownDuration(remainingSeconds, false);
    const confidence = exactRef.evidence[0]?.confidence || 'confirmed';
    return {
      id: activeCountdown.id,
      title: activeCountdown.title,
      floor: activeCountdown.floor,
      target: activeCountdown.target,
      remainingSeconds,
      status: 'stated',
      basis: 'exact-reference',
      confidence,
      formattedTime,
      formattedLabel: `${formattedTime} · stated`,
      referencePoints: [exactRef],
      note: exactRef.note,
    };
  }

  // 2. Find bounding references R1 and R2
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

  // Check compatibility: Countdown time remaining must strictly decrease as sequence progresses
  if (r2.remainingSeconds >= r1.remainingSeconds) {
    // Non-monotonic countdown (reset, paused, or replaced) -> do not interpolate across segment break
    return null;
  }

  // Check if events between r1 and r2 contain countdown pause/resume/reset/phase change events
  const intermediateEvents = events.filter((e) => e.sequence > r1!.sequence && e.sequence <= r2!.sequence);
  const hasPhaseBreak = intermediateEvents.some(isCountdownPhaseBreakEvent);

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
  let basis: 'elapsed-duration' | 'sequence-position' = 'sequence-position';
  let confidence: ActiveCountdownState['confidence'] = 'low-confidence';

  if (
    typeof dur1 === 'number' &&
    typeof dur2 === 'number' &&
    typeof durTarget === 'number' &&
    dur2 > dur1 &&
    durTarget >= dur1 &&
    durTarget <= dur2
  ) {
    // Elapsed-duration interpolation
    const fraction = (durTarget - dur1) / (dur2 - dur1);
    interpolatedSeconds = Math.round(r1.remainingSeconds + fraction * (r2.remainingSeconds - r1.remainingSeconds));
    basis = 'elapsed-duration';
    confidence = r1.evidence[0]?.confidence || 'confirmed';
  } else {
    // Sequence-position interpolation fallback
    const fraction = (targetSequence - r1.sequence) / (r2.sequence - r1.sequence);
    interpolatedSeconds = Math.round(r1.remainingSeconds + fraction * (r2.remainingSeconds - r1.remainingSeconds));
    basis = 'sequence-position';
    confidence = 'low-confidence';
  }

  const formattedTime = formatCountdownDuration(interpolatedSeconds, true);

  return {
    id: activeCountdown.id,
    title: activeCountdown.title,
    floor: activeCountdown.floor,
    target: activeCountdown.target,
    remainingSeconds: interpolatedSeconds,
    status: 'estimated',
    basis,
    confidence,
    formattedTime,
    formattedLabel: `${formattedTime} · estimated`,
    referencePoints: [r1, r2],
    note: r1.note || r2.note,
  };
}
