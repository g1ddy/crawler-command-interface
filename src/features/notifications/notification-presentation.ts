import type { CrawlerEvent, NotificationKind, NotificationSeverity, RewardSpec } from "../../../app/domain/types";

export interface CrawlerNotification { id: string; sequence: number; kind: NotificationKind; severity: NotificationSeverity; title: string; message: string; rewards?: RewardSpec[]; }
export interface DerivedNotificationReward { kind: string; detail: string; }
export interface DerivedNotificationItem extends CrawlerNotification { icon: string; formattedRewards?: DerivedNotificationReward[]; isCurrentDelivery: boolean; }
export interface DerivedNotificationsPresentation { isLive: boolean; sequence: number; totalCount: number; badgeLabel: string; hasNotifications: boolean; notifications: DerivedNotificationItem[]; }

export function projectNotifications(events: CrawlerEvent[], sequence: number): CrawlerNotification[] {
  if (!events) return [];
  return events.filter(event => event.sequence <= sequence).flatMap(event => {
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
  }).sort((a, b) => b.sequence - a.sequence);
}

/** Derives crawler-visible notification history from authored deliveries at the selected temporal boundary. */
export function deriveNotificationPresentation({
  events,
  sequence,
  isLive,
}: {
  events: CrawlerEvent[];
  sequence: number;
  isLive: boolean;
}): DerivedNotificationsPresentation {
  const raw = projectNotifications(events, sequence);
  const notifications = raw.map(item => ({
    ...item,
    icon: item.kind === "achievement" ? "🏆" : item.kind === "progression" ? "⬆" : "🎁",
    formattedRewards: item.rewards?.map(reward => ({
      kind: reward.kind.toUpperCase(),
      detail: [reward.boxType, reward.rarity, reward.amount, reward.description].filter(value => value !== undefined).map(String).join(" · ") ? ` · ${[reward.boxType, reward.rarity, reward.amount, reward.description].filter(value => value !== undefined).map(String).join(" · ")}` : "",
    })),
    isCurrentDelivery: item.sequence === sequence,
  }));
  const totalCount = notifications.length;
  return { isLive, sequence, totalCount, badgeLabel: isLive ? `${totalCount} ${totalCount === 1 ? "NOTICE" : "NOTICES"} · LIVE` : `${totalCount} ${totalCount === 1 ? "NOTICE" : "NOTICES"} · REPLAY @ SEQ #${sequence}`, hasNotifications: totalCount > 0, notifications };
}
