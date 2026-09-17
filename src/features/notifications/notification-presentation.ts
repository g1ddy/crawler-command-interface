import type { CrawlerNotification } from "../../../app/domain/notifications";

export type { CrawlerNotification } from "../../../app/domain/notifications";
export interface DerivedNotificationReward { kind: string; detail: string; }
export interface DerivedNotificationItem extends CrawlerNotification { icon: string; formattedRewards?: DerivedNotificationReward[]; isAuthoredAtCurrentSequence: boolean; }
export interface DerivedNotificationsPresentation { sequence: number; totalCount: number; badgeLabel: string; hasNotifications: boolean; notifications: DerivedNotificationItem[]; }

export function deriveNotificationPresentation({
  notifications,
  sequence,
}: {
  notifications: CrawlerNotification[];
  sequence: number;
}): DerivedNotificationsPresentation {
  const items = notifications.map(item => ({
    ...item,
    icon: item.kind === "achievement" ? "🏆" : item.kind === "progression" ? "⬆" : "🎁",
    formattedRewards: item.rewards?.map(reward => {
      const detail = [reward.boxType, reward.rarity, reward.amount, reward.description]
        .filter(value => value !== undefined)
        .map(String)
        .join(" · ");
      return { kind: reward.kind.toUpperCase(), detail: detail ? ` · ${detail}` : "" };
    }),
    isAuthoredAtCurrentSequence: item.sequence === sequence,
  }));
  const totalCount = items.length;
  return { sequence, totalCount, badgeLabel: `${totalCount} ${totalCount === 1 ? "NOTICE" : "NOTICES"}`, hasNotifications: totalCount > 0, notifications: items };
}
