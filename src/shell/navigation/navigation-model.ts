export const ROOT_NAVIGATION = [
  { id: "crawler", label: "CRAWLER" },
  { id: "inventory", label: "INVENTORY" },
  { id: "skills", label: "SKILLS" },
  { id: "quests", label: "QUESTS" },
  { id: "ratings", label: "RATINGS" },
  { id: "party", label: "PARTY" },
  { id: "notifications", label: "NOTIFICATIONS" },
] as const;

export type RootNavigationItem = (typeof ROOT_NAVIGATION)[number];
export type RootView = RootNavigationItem["id"];
export const ROOT_VIEW_ORDER: RootView[] = ROOT_NAVIGATION.map((item) => item.id);
