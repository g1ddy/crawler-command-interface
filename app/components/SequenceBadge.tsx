"use client";
import React from 'react';
import { getNarrativePresentation } from '../domain/narrative-presentation';
import type { NarrativeEventKind } from '../domain/types';

export function SequenceBadge({ kind }: { kind: NarrativeEventKind | string | undefined }) {
  const presentation = getNarrativePresentation(kind);
  return <span className={`sequence-badge sequence-${presentation.group} ${presentation.terminal ? 'terminal' : ''}`} aria-label={presentation.accessibleLabel} title={presentation.accessibleLabel}>{presentation.icon} {presentation.label.toUpperCase()}</span>;
}
