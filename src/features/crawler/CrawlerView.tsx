import { useState } from "react";
import type { CrawlerState, ProjectedObservationsState, ProjectedObservationValue } from "../../../app/domain/types";
import { PlayerStats } from "./stats/PlayerStats";
import { HealthConditions } from "./health/HealthConditions";
import type { CrawlerActions } from "../../application/crawler-action-contracts";
export function CrawlerView(props: { state: CrawlerState; observations: ProjectedObservationsState; onInspectStat: (s: string) => void; onInspectObservation: (o: ProjectedObservationValue) => void; actions: CrawlerActions }) {
  const [mode, setMode] = useState<"stats" | "health">("stats");
  return <section className="view-content"><div className="subnav"><button className={mode === "stats" ? "on" : ""} onClick={() => setMode("stats")}>STATS</button><button className={mode === "health" ? "on" : ""} onClick={() => setMode("health")}>HEALTH / CONDITIONS</button></div>{mode === "stats" ? <PlayerStats {...props} /> : <HealthConditions state={props.state} observations={props.observations} onInspectObservation={props.onInspectObservation} />}</section>;
}
