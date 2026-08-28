import type { CrawlerEvent, NarrativeEventKind, TimelineEvidence, TimelinePosition } from './types.ts';

export type NarrativeGroup = 'rules' | 'broadcasts' | 'encounters' | 'floor-transitions' | 'context';

export interface NarrativePresentation {
  label: string;
  icon: string;
  accessibleLabel: string;
  group: NarrativeGroup;
  terminal: boolean;
}

const presentations: Record<NarrativeEventKind, NarrativePresentation> = {
  'rule-changed': { label: 'Rule update', icon: '§', accessibleLabel: 'Historical rule or directive update', group: 'rules', terminal: false },
  'episode-released': { label: 'Broadcast', icon: '◉', accessibleLabel: 'Broadcast milestone', group: 'broadcasts', terminal: false },
  'floor-collapsed': { label: 'Floor collapsed', icon: '▼', accessibleLabel: 'Terminal floor collapse', group: 'floor-transitions', terminal: true },
  'encounter-resolved': { label: 'Encounter resolved', icon: '✓', accessibleLabel: 'Encounter resolution', group: 'encounters', terminal: false },
  'encounter-started': { label: 'Encounter started', icon: '⚔', accessibleLabel: 'Encounter started', group: 'encounters', terminal: false },
  'floor-entered': { label: 'Floor entered', icon: '→', accessibleLabel: 'Floor entry', group: 'floor-transitions', terminal: false },
  'floor-exited': { label: 'Floor exited', icon: '←', accessibleLabel: 'Floor exit', group: 'floor-transitions', terminal: false },
  'location-discovered': { label: 'Location found', icon: '⌖', accessibleLabel: 'Location discovered', group: 'context', terminal: false },
  'dialogue': { label: 'Dialogue', icon: '“', accessibleLabel: 'Dialogue event', group: 'context', terminal: false },
  'choice-made': { label: 'Choice', icon: '◇', accessibleLabel: 'Choice made', group: 'context', terminal: false },
  'transformation': { label: 'Transformation', icon: '✦', accessibleLabel: 'Transformation event', group: 'context', terminal: false },
  'party-changed': { label: 'Party update', icon: '♟', accessibleLabel: 'Party membership update', group: 'context', terminal: false },
  other: { label: 'Story event', icon: '•', accessibleLabel: 'Narrative story event', group: 'context', terminal: false },
};

export function getNarrativePresentation(kind: NarrativeEventKind | string | undefined): NarrativePresentation {
  return presentations[kind as NarrativeEventKind] ?? presentations.other;
}

export function isNarrativeEvent(event: CrawlerEvent): boolean {
  return event.type === 'NarrativeEvent';
}

export function narrativeEventsAtOrBefore(
  events: CrawlerEvent[],
  sequence: number,
  floor: number | 'all',
  kind?: NarrativeEventKind,
): CrawlerEvent[] {
  return events.filter((event) =>
    isNarrativeEvent(event) && event.sequence <= sequence &&
    (floor === 'all' || event.position?.floor === floor) &&
    (!kind || event.kind === kind)
  ).sort((a, b) => a.sequence - b.sequence);
}

export function formatSequencePosition(position?: TimelinePosition, evidence: TimelineEvidence[] = []): string {
  const floor = position?.floor ? `Floor ${position.floor}` : 'Floor not sourced';
  const chapter = position?.chapter ?? evidence.find((item) => item.locator?.chapter)?.locator?.chapter;
  const timestamp = evidence.find((item) => item.locator?.timestamp)?.locator?.timestamp;
  const scene = position?.scene;
  const anchor = timestamp ? `timestamp ${timestamp}` : chapter ? `Chapter ${chapter}` : scene ? `Scene ${scene}` : 'exact time not sourced';
  return `${floor} · ${anchor}`;
}
