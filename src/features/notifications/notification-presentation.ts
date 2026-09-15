import type { CrawlerEvent, NotificationKind, NotificationSeverity, RewardSpec } from "../../../app/domain/types";

export interface CrawlerNotification {
  id: string;
  sequence: number;
  kind: NotificationKind;
  severity: NotificationSeverity;
  title: string;
  message: string;
  rewards?: RewardSpec[];
}

export interface DeriveNotificationsPresentationInput {
  events: CrawlerEvent[];
  sequence: number;
  isLive?: boolean;
}

export interface DerivedNotificationReward {
  kind: string;
  detail: string;
}

export interface DerivedNotificationItem extends CrawlerNotification {
  icon: string;
  formattedRewards?: DerivedNotificationReward[];
  isCurrentDelivery: boolean;
}

export interface DerivedNotificationsPresentation {
  isLive: boolean;
  sequence: number;
  totalCount: number;
  badgeLabel: string;
  hasNotifications: boolean;
  notifications: DerivedNotificationItem[];
}

/** Maps only event types whose authored semantics establish crawler-visible delivery. */
export function projectNotifications(events: CrawlerEvent[], sequence: number): CrawlerNotification[] {
  const visible = events.filter((event) => event.sequence <= sequence);
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

export function formatReward(reward: RewardSpec): string {
  const details = [reward.boxType, reward.rarity, reward.amount, reward.description]
    .filter((v) => v !== undefined)
    .map(String)
    .join(" · ");
  return details ? ` · ${details}` : "";
}

export function deriveNotificationsPresentation(
  input: DeriveNotificationsPresentationInput
): DerivedNotificationsPresentation {
  const { events = [], sequence, isLive = false } = input;
  const rawNotices = projectNotifications(events, sequence);

  const notifications: DerivedNotificationItem[] = rawNotices.map((item) => {
    const icon = item.kind === "achievement" ? "🏆" : item.kind === "progression" ? "⬆" : "🎁";
    const formattedRewards = item.rewards?.map((reward) => ({
      kind: reward.kind.toUpperCase(),
      detail: formatReward(reward),
    }));

    return {
      ...item,
      icon,
      formattedRewards,
      isCurrentDelivery: item.sequence === sequence,
    };
  });

  const totalCount = notifications.length;
  const badgeLabel = isLive
    ? `${totalCount} ${totalCount === 1 ? "NOTICE" : "NOTICES"} · LIVE`
    : `${totalCount} ${totalCount === 1 ? "NOTICE" : "NOTICES"} · REPLAY @ SEQ #${sequence}`;

  return {
    isLive,
    sequence,
    totalCount,
    badgeLabel,
    hasNotifications: totalCount > 0,
    notifications,
  };
}
