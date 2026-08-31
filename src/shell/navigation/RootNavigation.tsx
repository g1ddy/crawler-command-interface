export type RootView = "crawler" | "inventory" | "skills" | "quests" | "ratings" | "notifications";

export function RootNavigation({
  active,
  set,
  capabilities,
  onOpenTools,
}: {
  active: RootView;
  set: (view: RootView) => void;
  capabilities: Record<RootView, boolean>;
  onOpenTools: () => void;
}) {
  return (
    <nav className="nav" aria-label="Main Navigation">
      <b><span>WORLD DUNGEON</span> AUTHORITY</b>
      <button className={active === "crawler" ? "active" : ""} aria-pressed={active === "crawler"} onClick={() => set("crawler")}>CRAWLER</button>
      <button className={active === "inventory" ? "active" : ""} aria-pressed={active === "inventory"} onClick={() => set("inventory")}>INVENTORY</button>
      <button className={active === "skills" ? "active" : ""} aria-pressed={active === "skills"} onClick={() => set("skills")}>SKILLS</button>
      {capabilities.quests && (
        <button className={active === "quests" ? "active" : ""} aria-pressed={active === "quests"} onClick={() => set("quests")}>QUESTS</button>
      )}
      {capabilities.ratings && <button className={active === "ratings" ? "active" : ""} aria-pressed={active === "ratings"} onClick={() => set("ratings")}>RATINGS</button>}
      {capabilities.notifications && <button className={active === "notifications" ? "active" : ""} aria-pressed={active === "notifications"} onClick={() => set("notifications")}>NOTIFICATIONS</button>}
      <button className="secondary-tools" onClick={onOpenTools} aria-label="Open data tools" title="Import, export, or reset timeline data">⚙ TOOLS</button>
    </nav>
  );
}
