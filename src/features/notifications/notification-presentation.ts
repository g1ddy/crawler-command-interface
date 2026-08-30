import type { CrawlerEvent, CrawlerState, RewardSpec } from "../../../app/domain/types";
export type NotificationKind = "achievement" | "progression" | "skill" | "quest" | "reward" | "system" | "floor";
export type NotificationSeverity = "info" | "success" | "warning" | "critical";
export interface CrawlerNotification { id: string; sequence: number; kind: NotificationKind; severity: NotificationSeverity; title: string; message: string; rewards?: RewardSpec[]; }
/** Maps only event types whose authored semantics establish crawler-visible delivery. */
export function projectNotifications(events: CrawlerEvent[], state: CrawlerState, sequence: number): CrawlerNotification[] {
  const visible = events.filter(event => event.sequence <= sequence);
  const mapped = visible.flatMap((event): CrawlerNotification[] => {
    if (event.type === "AchievementUnlocked") {
      const achievement = state.achievements.find(item => item.unlockedAtSequence === event.sequence);
      return [{ id: event.id, sequence: event.sequence, kind: "achievement", severity: "success", title: achievement?.title ?? event.achievement?.title ?? "Achievement unlocked", message: achievement?.description ?? event.achievement?.description ?? event.summary, rewards: achievement?.rewards }];
    }
    if (event.type === "LevelChanged") return [{ id: event.id, sequence: event.sequence, kind: "progression", severity: "success", title: "Level up", message: event.summary }];
    if (event.type === "PermanentEntitlementGranted") return [{ id: event.id, sequence: event.sequence, kind: "reward", severity: "success", title: "Reward delivered", message: event.summary }];
    // Generic NarrativeEvent, QuestUpdated, activity logs, and untyped skill events
    // remain timeline-only because the current model does not author delivery.
    return [];
  });
  const achievementIds = new Set(mapped.filter(item => item.kind === "achievement").map(item => item.sequence));
  for (const achievement of state.achievements) if (achievement.unlockedAtSequence <= sequence && !achievementIds.has(achievement.unlockedAtSequence)) mapped.push({ id: `achievement-${achievement.achievementId}`, sequence: achievement.unlockedAtSequence, kind: "achievement", severity: "success", title: achievement.title, message: achievement.description, rewards: achievement.rewards });
  return mapped.sort((a, b) => b.sequence - a.sequence);
}
