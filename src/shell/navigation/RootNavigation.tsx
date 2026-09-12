import type { CanonCapabilities } from "../../application/capabilities";
import { ROOT_NAVIGATION, type RootView } from "./navigation-model";
import styles from "./RootNavigation.module.css";

export function RootNavigation({
  active,
  set,
  capabilities,
  onOpenTools,
}: {
  active: RootView;
  set: (view: RootView) => void;
  capabilities: CanonCapabilities;
  onOpenTools: () => void;
}) {
  return (
    <div className={styles.bar} data-shell-navigation>
    <nav className={styles.navigation} aria-label="Main Navigation">
      {ROOT_NAVIGATION.filter((item) => capabilities[item.id]).map((item) => (
        <button
          key={item.id}
          className={styles.destination}
          aria-pressed={active === item.id}
          onClick={() => set(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
      <div className={styles.utilities} role="group" aria-label="Application tools">
      <button
        className={styles.tools}
        onClick={onOpenTools}
        aria-label="Open data tools"
        title="Import, export, or reset timeline data"
      >
        ⚙ SYSTEM TOOLS
      </button>
      </div>
    </div>
  );
}
