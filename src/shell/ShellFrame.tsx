import type { ReactNode } from "react";
import type { HudPresentation } from "./hud/hud-presentation";
import styles from "./ShellFrame.module.css";

/** Layout only: no timeline, feature, controller, or persistence dependencies. */
export function ShellFrame({ presentation, isLive, hud, navigation, replay, children, overlays, feedback }: {
  presentation: HudPresentation;
  isLive: boolean;
  hud: ReactNode;
  navigation: ReactNode;
  replay: ReactNode;
  children: ReactNode;
  overlays: ReactNode;
  feedback: ReactNode;
}) {
  const preview = presentation !== "production";
  return <div className={preview ? "concept-hud-wrapper" : styles.frame}
    data-concept={preview ? presentation : undefined}
    data-hud-presentation={preview ? presentation : undefined}>
    <a className={styles.skipLink} href="#crawler-workspace">Skip to active domain</a>
    <main data-mode={isLive ? "live" : "replay"} data-presentation={presentation} data-concept={presentation}>
      {hud}
      {navigation}
      {feedback}
      <div className={preview ? "view" : styles.workspace}>
        {replay}
        <div id="crawler-workspace" className={styles.feature} tabIndex={-1}>
          {children}
        </div>
      </div>
      {overlays}
    </main>
  </div>;
}
