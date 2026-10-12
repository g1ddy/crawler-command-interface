import type { CrawlerState } from '../types.ts';

export function applySkillGranted(state: CrawlerState, event: Record<string, unknown>): void {
  const skillId = String(event.skillId);
  if (!state.skills.some((s) => s.skillId === skillId)) {
    const category = event.category as 'combat' | 'utility' | 'passive' | undefined;
    state.skills.push({
      skillId,
      name: String(event.name || ''),
      owner: (event.owner as 'carl' | 'donut') || undefined,
      icon: typeof event.icon === 'string' ? event.icon : undefined,
      rank: typeof event.rank === 'string' ? event.rank : undefined,
      description: typeof event.description === 'string' ? event.description : undefined,
      cooldown: typeof event.cooldown === 'string' ? event.cooldown : undefined,
      category: category || undefined,
      cost: typeof event.cost === 'string' ? event.cost : undefined,
      synergies: Array.isArray(event.synergies) ? (event.synergies as string[]) : undefined,
      modifier: typeof event.modifier === 'string' ? event.modifier : undefined,
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
