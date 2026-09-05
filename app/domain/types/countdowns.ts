import type { TimelineEvidence } from './catalogs.ts';

export interface CountdownReference {
  sequence: number;
  remainingSeconds: number;
  activationOffset?: number;
  evidence: TimelineEvidence[];
  note?: string;
}

export interface TimelineCountdown {
  id: string;
  title: string;
  floor: number;
  target: 'floor-collapse' | 'safe-room-closure';
  references: CountdownReference[];
}

export interface FloorCountdownReference {
  anchorEventId: string;
  remainingSeconds: number;
  activationOffset?: number;
  evidence: TimelineEvidence[];
  note?: string;
}

export interface FloorCountdown {
  id: string;
  title: string;
  target: 'floor-collapse' | 'safe-room-closure';
  references: FloorCountdownReference[];
}

export interface ActiveCountdownState {
  id: string;
  title: string;
  floor: number;
  target: 'floor-collapse' | 'safe-room-closure';
  lifecycleStatus: 'scheduled' | 'active' | 'completed';
  remainingSeconds: number;
  activationOffset?: number;
  status: 'stated' | 'estimated';
  /** True when this is the latest source reading, not a time at the selected sequence. */
  isStale: boolean;
  basis:
    | 'exact-reference'
    | 'last-known-reference'
    | 'elapsed-duration'
    | 'sequence-position'
    | 'elapsed-duration-extrapolation'
    | 'sequence-position-extrapolation'
    | 'activation-reference'
    | 'activation-extrapolation';
  confidence: 'confirmed' | 'corroborated' | 'candidate' | 'disputed' | 'low-confidence';
  formattedTime: string;
  formattedLabel: string;
  referencePoints: CountdownReference[];
  note?: string;
}

export interface RawFloorCountdown {
  id: string;
  title: string;
  target: 'floor-collapse' | 'safe-room-closure';
}
