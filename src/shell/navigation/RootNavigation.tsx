import type { CanonCapabilities } from "../../application/capabilities";
import { ROOT_NAVIGATION, type RootView } from "./navigation-model";
import type { PrimaryNavigationContract } from "./navigation-contract";
import styles from "./RootNavigation.module.css";

export interface RootNavigationProps {
  active: RootView;
  set: (view: RootView) => void;
  capabilities: CanonCapabilities;
  onOpenTools: () => void;
  contract?: PrimaryNavigationContract;
}

export function RootNavigation({
  active,
  set,
  capabilities,
  onOpenTools,
  contract,
}: RootNavigationProps) {
  const items = contract
    ? contract.items.filter((item) => item.isAvailable)
    : ROOT_NAVIGATION.filter((item) => capabilities[item.id]).map((item) => ({
        id: item.id,
        label: item.label,
        isAvailable: true,
      }));

  const activeView = contract ? contract.activeView : active;

  return (
    <div className={styles.bar} data-shell-navigation>
      <nav className={styles.navigation} aria-label="Main Navigation">
        {items.map((item) => (
          <button
            key={item.id}
            className={styles.destination}
            aria-pressed={activeView === item.id}
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
