import type { CrawlerEvent, NotificationKind, NotificationSeverity, RewardSpec } from "../../../app/domain/types";
export interface CrawlerNotification { id: string; sequence: number; kind: NotificationKind; severity: NotificationSeverity; title: string; message: string; rewards?: RewardSpec[]; }
/** Maps only event types whose authored semantics establish crawler-visible delivery. */
export function projectNotifications(events: CrawlerEvent[], sequence: number): CrawlerNotification[] {
  const visible = events.filter(event => event.sequence <= sequence);
  const mapped = visible.flatMap((event): CrawlerNotification[] => {
    const delivery = event.notificationDelivery;
    if (!delivery?.delivered) return [];
    const achievement = event.type === "AchievementUnlocked" ? event.achievement : undefined;
    return [{ id: event.id, sequence: event.sequence, kind: delivery.kind, severity: delivery.severity, title: delivery.title ?? achievement?.title ?? "Dungeon notification", message: delivery.message ?? achievement?.description ?? event.summary, rewards: achievement?.reward }];
  });
  return mapped.sort((a, b) => b.sequence - a.sequence);
}
