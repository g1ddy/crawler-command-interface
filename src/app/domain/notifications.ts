import type { CrawlerEvent, NotificationKind, NotificationSeverity, RewardSpec } from "./types";

export interface CrawlerNotification {
  id: string;
  sequence: number;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  message: string;
  rewards?: RewardSpec[];
}

/** Projects authored crawler-visible notification deliveries at the selected temporal boundary. */
export function projectNotifications(events: CrawlerEvent[], sequence: number): CrawlerNotification[] {
  if (!events) return [];
  return events
    .filter(event => event.sequence <= sequence)
    .flatMap(event => {
      const delivery = event.notificationDelivery;
      if (!delivery?.delivered) return [];
      const achievement = event.type === "AchievementUnlocked" ? event.achievement : undefined;
      return [{
        id: event.id ?? `evt-${event.sequence}`,
        sequence: event.sequence,
        kind: delivery.kind,
        severity: delivery.severity,
        title: delivery.title || achievement?.title || "Dungeon notification",
        message: delivery.message || achievement?.description || event.summary || "Dungeon notification",
        rewards: achievement?.reward,
      }];
    })
    .sort((a, b) => b.sequence - a.sequence);
}
