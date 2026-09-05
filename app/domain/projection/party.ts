import type { CrawlerState } from '../types.ts';

export function applyPartyFormed(state: CrawlerState, event: Record<string, unknown>): void {
  const party = event.party as CrawlerState['party'];
  if (party) {
    state.party = { ...party, members: party.members.map((member) => ({ ...member })) };
  }
}
