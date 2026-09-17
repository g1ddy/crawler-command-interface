import type { DerivedRatingsPresentation } from "./public";
import { TelemetryBadge } from "../timeline/public";
import { Panel } from "../../shared/ui/Panel";
import styles from "./RatingsView.module.css";

export function RatingsView({ presentation, selectedSequence, onInspectObservation }: { presentation: DerivedRatingsPresentation; selectedSequence?: number; onInspectObservation: (o: DerivedRatingsPresentation["groups"][number]["metrics"][number]["observation"]) => void }) {
  return <section className={styles.viewContent}>
    <header className={styles.title}>
      <div><p className={styles.eyebrow}>BROADCAST TELEMETRY</p><h1>RATINGS</h1></div>
      <b className={styles.audienceBadge}>{presentation.audienceBadgeLabel}</b>
    </header>
    {!presentation.hasMetrics ? <Panel title="RATINGS UNAVAILABLE"><p className={styles.unavailableText}>No authored broadcast metrics are available at this sequence.</p></Panel> : <div className={styles.broadcastPage}>
      {presentation.groups.map(group => <Panel key={group.group} title={group.title}><div className={styles.metricGroup}>
        {group.metrics.map(metric => <div key={metric.key} className={styles.metricRow}>
          <span><b className={styles.metricValue}>{typeof metric.value === "number" ? metric.value.toLocaleString() : metric.value}</b>{" "}{metric.label}</span>
          <TelemetryBadge observation={metric.observation} selectedSequence={selectedSequence} onClick={() => onInspectObservation(metric.observation)} />
        </div>)}
      </div></Panel>)}
    </div>}
  </section>;
}
