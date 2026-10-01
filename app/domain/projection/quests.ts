import type { CrawlerState, Quest } from '../types.ts';

export function applyQuestUpdated(state: CrawlerState, event: Record<string, unknown>): void {
  const questId = String(event.questId);
  const questIndex = state.quests.findIndex((q) => q.questId === questId);
  const updatedQuest: Quest = {
    questId,
    title: String(event.title || ''),
    urgency: (event.urgency as 'URGENT' | 'STANDARD' | 'COMPLETED') || 'STANDARD',
    goals: Array.isArray(event.goals) ? (event.goals as string[]) : [],
    rewards: String(event.rewards || ''),
    status: (event.status as 'active' | 'completed' | 'failed') || 'active',
  };
  if (questIndex >= 0) state.quests[questIndex] = updatedQuest;
  else state.quests.push(updatedQuest);
}
