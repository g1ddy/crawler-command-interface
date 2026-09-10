import type { CrawlerEvent, NotificationKind, NotificationSeverity, RewardSpec } from "../../../app/domain/types";
export interface CrawlerNotification { id: string; sequence: number; kind: NotificationKind; severity: NotificationSeverity; title: string; message: string; rewards?: RewardSpec[]; }
/** Maps only event types whose authored semantics establish crawler-visible delivery. */
export function projectNotifications(events: CrawlerEvent[], sequence: number): CrawlerNotification[] {
  const visible = events.filter(event => event.sequence <= sequence);
  const mapped: CrawlerNotification[] = [];
  for (const event of visible) {
    const delivery = event.notificationDelivery;
    if (!delivery?.delivered) continue;
    const achievement = event.type === "AchievementUnlocked" ? event.achievement : undefined;
    const title = (delivery.title || achievement?.title || "Dungeon notification") as string;
    const message = (delivery.message || achievement?.description || event.summary || "Dungeon notification") as string;
    mapped.push({
      id: event.id ?? `evt-${event.sequence}`,
      sequence: event.sequence,
      kind: delivery.kind,
      severity: delivery.severity,
      title,
      message,
      rewards: achievement?.reward,
    });
  }
  return mapped.sort((a, b) => b.sequence - a.sequence);
}
