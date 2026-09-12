import { useState } from "react";
import type { CrawlerState, ProjectedObservationsState, ProjectedObservationValue } from "../../../app/domain/types.ts";
import { PlayerStats } from "./stats/PlayerStats.tsx";
import { HealthConditions } from "./health/HealthConditions.tsx";
import type { CrawlerActions } from "../../application/crawler-action-contracts.ts";
import { deriveCrawlerPresentation } from "./crawler-presentation.ts";
import styles from "./CrawlerView.module.css";

export function CrawlerView(props: {
  state: CrawlerState;
  observations: ProjectedObservationsState;
  onInspectStat: (s: string) => void;
  onInspectObservation: (o: ProjectedObservationValue) => void;
  actions: CrawlerActions;
}) {
  const [mode, setMode] = useState<"stats" | "health">("stats");
  const presentation = deriveCrawlerPresentation(props.state, props.observations);

  return (
    <section className={styles.viewContent}>
      <div className={styles.subnav}>
        <button className={mode === "stats" ? styles.on : ""} onClick={() => setMode("stats")}>
          STATS
        </button>
        <button className={mode === "health" ? styles.on : ""} onClick={() => setMode("health")}>
          HEALTH / CONDITIONS
        </button>
      </div>
      {mode === "stats" ? (
        <PlayerStats
          presentation={presentation}
          onInspectStat={props.onInspectStat}
          onInspectObservation={props.onInspectObservation}
          actions={props.actions}
        />
      ) : (
        <HealthConditions presentation={presentation} onInspectObservation={props.onInspectObservation} />
      )}
    </section>
  );
}
