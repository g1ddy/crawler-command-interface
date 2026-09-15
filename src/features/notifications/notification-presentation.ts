import type { RewardSpec } from "../../../app/domain/types";
import type { CrawlerNotification } from "../../../app/domain/projection/notifications";

export interface DeriveNotificationsPresentationInput {
  notifications: CrawlerNotification[];
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
  const { notifications: rawNotices = [], sequence, isLive = false } = input;

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
