export type RootView = "crawler" | "inventory" | "skills" | "quests";

export function RootNavigation({
  active,
  set,
  hasQuests = false,
  onOpenTools,
}: {
  active: RootView;
  set: (view: RootView) => void;
  hasQuests?: boolean;
  onOpenTools: () => void;
}) {
  return (
    <nav className="nav" aria-label="Main Navigation">
      <b><span>WORLD DUNGEON</span> AUTHORITY</b>
      <button className={active === "crawler" ? "active" : ""} aria-pressed={active === "crawler"} onClick={() => set("crawler")}>CRAWLER</button>
      <button className={active === "inventory" ? "active" : ""} aria-pressed={active === "inventory"} onClick={() => set("inventory")}>INVENTORY</button>
      <button className={active === "skills" ? "active" : ""} aria-pressed={active === "skills"} onClick={() => set("skills")}>SKILLS</button>
      {hasQuests && (
        <button className={active === "quests" ? "active" : ""} aria-pressed={active === "quests"} onClick={() => set("quests")}>QUESTS</button>
      )}
      <button className="secondary-tools" onClick={onOpenTools} aria-label="Open data tools" title="Import, export, or reset timeline data">⚙ TOOLS</button>
    </nav>
  );
}
