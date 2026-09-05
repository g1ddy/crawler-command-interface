import type { CrawlerState } from '../types.ts';

export function applyBroadcastUpdated(state: CrawlerState, event: Record<string, unknown>): void {
  state.broadcast = {
    viewers: Number(event.viewers ?? state.broadcast.viewers),
    viewerDelta: String(event.viewerDelta ?? state.broadcast.viewerDelta),
    followers: Number(event.followers ?? state.broadcast.followers),
    fameRank: String(event.fameRank ?? state.broadcast.fameRank),
    sponsorInterest: Boolean(event.sponsorInterest ?? state.broadcast.sponsorInterest),
  };
}
