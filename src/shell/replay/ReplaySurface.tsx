"use client";
import type {
  ReplayCommandCallbacks,
  ReplayPresentation,
} from "../../features/timeline/public";
import { ReplayControls } from "./ReplayControls";
import styles from "./ReplaySurface.module.css";

export interface ReplaySurfaceProps {
  model: ReplayPresentation;
  commands: ReplayCommandCallbacks;
}

export function ReplaySurface({
  model,
  commands,
}: ReplaySurfaceProps) {
  return (
    <aside
      className={styles.surface}
      aria-label="Replay controls"
      data-mode={model.mode}
    >
      <ReplayControls
        model={model}
        commands={commands}
      />
    </aside>
  );
}
