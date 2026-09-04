import type { CrawlerState } from '../types.ts';

export function applySkillGranted(state: CrawlerState, event: Record<string, unknown>): void {
  const skillId = String(event.skillId);
  if (!state.skills.some((s) => s.skillId === skillId)) {
    state.skills.push({
      skillId,
      name: String(event.name || ''),
      icon: String(event.icon || '✦'),
      rank: String(event.rank || 'RANK 1'),
      description: String(event.description || ''),
      cooldown: String(event.cooldown || 'READY'),
      category: (event.category as 'combat' | 'utility' | 'passive') || 'combat',
      cost: typeof event.cost === 'string' ? event.cost : undefined,
      synergies: Array.isArray(event.synergies) ? (event.synergies as string[]) : undefined,
    });
  }
}

export function applySpellGranted(state: CrawlerState, event: Record<string, unknown>): void {
  const spell = event.spell as CrawlerState['spells'][number] | undefined;
  if (spell && !state.spells.some((existing) => existing.spellId === spell.spellId && existing.owner === spell.owner)) {
    state.spells.push({ ...spell, acquisitionSource: { ...spell.acquisitionSource } });
  }
}

export function applyHotlistUpdated(state: CrawlerState, event: Record<string, unknown>): void {
  if (Array.isArray(event.hotlist)) {
    state.hotlist = (event.hotlist as string[]).slice(0, 10);
  } else if (typeof event.index === 'number' && typeof event.skillId === 'string') {
    const newHotlist = Array.from({ length: 10 }, (_, index) => state.hotlist[index] ?? '');
    newHotlist[event.index] = event.skillId;
    state.hotlist = newHotlist;
  }
}
