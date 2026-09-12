import type { ProjectedObservationValue, ActiveEffect } from "../../../../app/domain/types.ts";
import { TelemetryBadge } from "../../timeline/public.ts";
import { Panel } from "../../../shared/ui/Panel.tsx";
import type { DerivedCrawlerPresentation, DerivedVitalPresentation } from "../crawler-presentation.ts";
import styles from "../CrawlerView.module.css";

const METER_COLOR_MAP: Record<string, string> = {
  red: styles.redFill,
  blue: styles.blueFill,
  yellow: styles.yellowFill,
};

function Vital({
  vital,
  sequence,
  inspect,
}: {
  vital: DerivedVitalPresentation;
  sequence: number;
  inspect: (o: ProjectedObservationValue) => void;
}) {
  const { name, current, maximum, observation, causalValue, displayAuthority, color } = vital;
  const percent = maximum ? Math.min(100, Math.round((Number(current ?? 0) / maximum) * 100)) : 0;
  const fillClass = METER_COLOR_MAP[color] ?? styles.redFill;

  return (
    <div className={styles.vitalRow}>
      <span>
        {name}
        <TelemetryBadge
          observation={observation}
          causalValue={causalValue}
          displayAuthority={displayAuthority}
          selectedSequence={sequence}
          onClick={() => observation && inspect(observation)}
        />
      </span>
      <b>
        {current?.toLocaleString() ?? "—"} / {maximum?.toLocaleString() ?? "—"}
      </b>
      <em className={styles.meterTrack}>
        <i className={`${styles.meterFill} ${fillClass}`} style={{ width: `${percent}%` }} />
      </em>
    </div>
  );
}

export function HealthConditions({
  presentation,
  onInspectObservation,
}: {
  presentation: DerivedCrawlerPresentation;
  onInspectObservation: (o: ProjectedObservationValue) => void;
}) {
  const { vitals, effects, sequence } = presentation;
  const { beneficial, harmful, injuries, other } = effects;

  const renderEffects = (effectList: ActiveEffect[], cardClass?: string) =>
    effectList.length ? (
      effectList.map((e) => (
        <div key={e.effectId} className={`${styles.effectCard} ${cardClass ?? ""}`}>
          <b>{e.durationSeconds}s</b>
          <span>
            {e.icon} {e.name}
          </span>
          <small>{e.description}</small>
        </div>
      ))
    ) : (
      <p className={styles.effectCard}>UNKNOWN</p>
    );

  return (
    <div className={styles.twoCol}>
      <Panel title="VITALS">
        <div className={styles.meters}>
          {vitals.map((v) => (
            <Vital key={v.name} vital={v} sequence={sequence} inspect={onInspectObservation} />
          ))}
        </div>
      </Panel>
      <Panel title="CONDITIONS">
        <div className={styles.effects}>
          <p className={styles.eyebrow}>INJURIES</p>
          {renderEffects(injuries, styles.badEffect)}
          <p className={styles.eyebrow}>BENEFICIAL EFFECTS</p>
          {renderEffects(beneficial, styles.goodEffect)}
          <p className={styles.eyebrow}>HARMFUL EFFECTS</p>
          {renderEffects(harmful, styles.badEffect)}
          <p className={styles.eyebrow}>OTHER / STATUS CONDITIONS</p>
          {renderEffects(other)}
        </div>
      </Panel>
    </div>
  );
}
