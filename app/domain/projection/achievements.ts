import type { CrawlerState } from '../types.ts';
import { structuredRewards } from './helpers.ts';

export function applyAchievementUnlocked(
  state: CrawlerState,
  event: Record<string, unknown>,
  sequence: number
): void {
  const ach = ((event.achievement as Record<string, unknown>) || event) as Record<string, unknown>;
  const achId = String(ach.id || ach.achievementId);
  if (!state.achievements.some((a) => a.achievementId === achId)) {
    state.achievements.push({
      achievementId: achId,
      title: String(ach.title || 'Achievement Unlocked'),
      ...(ach.recipient === 'carl' || ach.recipient === 'donut' || ach.recipient === 'party'
        ? { recipient: ach.recipient }
        : {}),
      description: String(ach.description || ''),
      rewards: structuredRewards(ach.reward, ach.rewards || ach.sourceTitle),
      icon: typeof ach.icon === 'string' ? ach.icon : '',
      unlockedAtSequence: sequence,
    });
  }
}

export function applyPermanentEntitlementGranted(state: CrawlerState, event: Record<string, unknown>): void {
  const entitlement = event.entitlement as { id?: unknown; name?: unknown; location?: unknown; description?: unknown } | undefined;
  if (entitlement?.id && !state.entitlements.some((existing) => existing.id === entitlement.id)) {
    state.entitlements.push({
      id: String(entitlement.id),
      name: String(entitlement.name || 'Permanent entitlement'),
      ...(typeof entitlement.location === 'string' ? { location: entitlement.location } : {}),
      ...(typeof entitlement.description === 'string' ? { description: entitlement.description } : {}),
    });
  }
}
