import type { CrawlerEvent, InventoryItem } from "../../../app/domain/types";

export type AwardHistoryEntry = {
  id: string;
  name: string;
  rarity: string;
  description: string;
  awardedAtSequence: number;
  achievementTitle: string;
  achievementSequence: number;
  openedAtSequence?: number;
  isInInventory: boolean;
};

export function deriveAwardHistory(
  events: CrawlerEvent[],
  sequence: number,
  inventory: InventoryItem[]
): AwardHistoryEntry[] {
  const visibleEvents = events.filter((event) => event.sequence <= sequence);
  const eventById = new Map(visibleEvents.map((event) => [event.id, event]));
  const openedByItem = new Map<string, CrawlerEvent>();

  for (const event of visibleEvents) {
    if (
      event.type === "ItemDiscarded" &&
      typeof event.itemInstanceId === "string" &&
      event.reason === "opened" &&
      !openedByItem.has(event.itemInstanceId)
    ) {
      openedByItem.set(event.itemInstanceId, event);
    }
  }

  return visibleEvents
    .filter((event) => event.type === "ItemAcquired")
    .flatMap((event) => {
      const item = event.item as
        | {
            instanceId?: unknown;
            name?: unknown;
            category?: unknown;
            rarity?: unknown;
            description?: unknown;
          }
        | undefined;

      if (!item || item.category !== "box" || typeof item.instanceId !== "string") return [];
      if (typeof event.causationId !== "string") return [];

      const achievementEvent = eventById.get(event.causationId);
      if (
        !achievementEvent ||
        achievementEvent.type !== "AchievementUnlocked" ||
        achievementEvent.sequence >= event.sequence
      ) {
        return [];
      }

      const achievement = achievementEvent.achievement as { title?: unknown } | undefined;
      if (typeof achievement?.title !== "string" || achievement.title.length === 0) return [];

      const openedBy = openedByItem.get(item.instanceId);
      const openedAtSequence =
        openedBy && openedBy.sequence > event.sequence ? openedBy.sequence : undefined;

      return [
        {
          id: item.instanceId,
          name: typeof item.name === "string" ? item.name : "Awarded Box",
          rarity: typeof item.rarity === "string" ? item.rarity : "unknown",
          description:
            typeof item.description === "string"
              ? item.description
              : "No box details are sourced.",
          awardedAtSequence: event.sequence,
          achievementTitle: achievement.title,
          achievementSequence: achievementEvent.sequence,
          openedAtSequence,
          isInInventory: inventory.some(
            (inventoryItem) => inventoryItem.instanceId === item.instanceId
          ),
        },
      ];
    });
}
