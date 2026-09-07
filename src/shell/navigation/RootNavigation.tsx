import type { RootCapabilities } from "./capabilities";
import { ROOT_NAVIGATION, type RootView } from "./navigation-model";

export function RootNavigation({
  active,
  set,
  capabilities,
  onOpenTools,
}: {
  active: RootView;
  set: (view: RootView) => void;
  capabilities: RootCapabilities;
  onOpenTools: () => void;
}) {
  return (
    <nav className="nav" aria-label="Main Navigation">
      <b><span>WORLD DUNGEON</span> AUTHORITY</b>
      {ROOT_NAVIGATION.filter((item) => capabilities[item.id]).map((item) => (
        <button
          key={item.id}
          className={active === item.id ? "active" : ""}
          aria-pressed={active === item.id}
          onClick={() => set(item.id)}
        >
          {item.label}
        </button>
      ))}
      <button
        className="secondary-tools"
        onClick={onOpenTools}
        aria-label="Open data tools"
        title="Import, export, or reset timeline data"
      >
        ⚙ TOOLS
      </button>
    </nav>
  );
}
