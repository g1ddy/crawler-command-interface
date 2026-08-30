import { useState } from "react";
import type { CrawlerEvent, CrawlerState, ProjectedObservationsState, ProjectedObservationValue } from "../../../app/domain/types";
import { PlayerStats } from "./stats/PlayerStats";
import { HealthConditions } from "./health/HealthConditions";
export function CrawlerView(props: { state: CrawlerState; observations: ProjectedObservationsState; onInspectStat: (s: string) => void; onInspectObservation: (o: ProjectedObservationValue) => void; onEmitEvent: (e: Partial<CrawlerEvent>) => void }) {
  const [mode, setMode] = useState<"stats" | "health">("stats");
  return <section className="view-content"><div className="subnav"><button className={mode === "stats" ? "on" : ""} onClick={() => setMode("stats")}>STATS</button><button className={mode === "health" ? "on" : ""} onClick={() => setMode("health")}>HEALTH / CONDITIONS</button></div>{mode === "stats" ? <PlayerStats {...props} /> : <HealthConditions state={props.state} observations={props.observations} onInspectObservation={props.onInspectObservation} />}</section>;
}
