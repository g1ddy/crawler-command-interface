import type { AttributeName, ProjectedObservationValue } from "../../../../app/domain/types";
import { TelemetryBadge } from "../../timeline/public";
import { Panel } from "../../../shared/ui/Panel";
import type { CrawlerActions } from "../../../application/crawler-action-contracts";
import type { DerivedCrawlerPresentation } from "../crawler-presentation";
import styles from "../CrawlerView.module.css";

const COLOR_MAP: Record<string, string> = {
  red: styles.redFill,
  green: styles.greenFill,
  yellow: styles.yellowFill,
  blue: styles.blueFill,
  purple: styles.purpleFill,
};

export function PlayerStats({
  presentation,
  isLive = true,
  onInspectStat,
  onInspectObservation,
  actions,
}: {
  presentation: DerivedCrawlerPresentation;
  isLive?: boolean;
  onInspectStat: (stat: string) => void;
  onInspectObservation: (observation: ProjectedObservationValue) => void;
  actions: CrawlerActions;
}) {
  const {
    name,
    crawlerNumber,
    race,
    class: crawlerClass,
    level,
    xp,
    maxXp,
    xpPercent,
    xpObservation,
    xpAuthority,
    availablePoints,
    availablePointsObservation,
    availablePointsAuthority,
    canAllocatePoints,
    sharedAttributesObservation,
    sharedAttributesAuthority,
    hasSharedAttributesEvidence,
    attributes,
    sequence,
  } = presentation;

  return (
    <>
      <header className={styles.profile}>
        <div className={styles.portrait}>C</div>
        <div>
          <p className={styles.eyebrow}>
            {crawlerNumber ? `CRAWLER #${crawlerNumber}` : "CRAWLER"}
          </p>
          <h1>{name}</h1>
          <i>LEVEL {level ?? "—"}</i>
          <i>RACE: {race}</i>
          <i>CLASS: {crawlerClass}</i>
        </div>
        <div className={styles.xp}>
          <span>
            EXPERIENCE{" "}
            <b>
              {xp?.toLocaleString() ?? "—"} / {maxXp?.toLocaleString() ?? "—"}
            </b>
            <TelemetryBadge
              observation={xpObservation}
              displayAuthority={xpAuthority}
              selectedSequence={sequence}
              onClick={() => {
                if (xpObservation) onInspectObservation(xpObservation);
              }}
            />
          </span>
          <em className={styles.xpTrack}>
            {xpPercent != null ? (
              <b className={styles.xpFill} style={{ width: `${xpPercent}%` }} />
            ) : null}
          </em>
        </div>
      </header>
      <Panel
        title="PLAYER ATTRIBUTES"
        action={
          hasSharedAttributesEvidence ? (
            <TelemetryBadge
              observation={sharedAttributesObservation}
              displayAuthority={sharedAttributesAuthority}
              selectedSequence={sequence}
              onClick={() => {
                if (sharedAttributesObservation) onInspectObservation(sharedAttributesObservation);
              }}
            />
          ) : undefined
        }
      >
        <div className={styles.stats}>
          {attributes.map((attr) => {
            const { name: attrName, color, value, causalValue, observation, displayAuthority } = attr;
            const fillClass = COLOR_MAP[color] ?? styles.redFill;
            return (
              <div key={attrName} className={styles.statRow}>
                <div className={styles.statClickable}>
                  <button className={styles.statNameBtn} onClick={() => onInspectStat(attrName)}>
                    <span>{attrName} 🔍</span>
                    <b>{value ?? "—"}</b>
                  </button>
                  {!hasSharedAttributesEvidence && (
                    <TelemetryBadge
                      observation={observation}
                      causalValue={causalValue}
                      displayAuthority={displayAuthority}
                      selectedSequence={sequence}
                      onClick={() => observation && onInspectObservation(observation)}
                    />
                  )}
                  <em className={styles.meterTrack}>
                    {value != null ? (
                      <i
                        className={`${styles.meterFill} ${fillClass}`}
                        style={{ width: `${Math.min(100, Number(value) * 2)}%` }}
                      />
                    ) : null}
                  </em>
                </div>
                <div className={styles.attrActions}>
                  <button
                    className={styles.attrBtn}
                    disabled={!(isLive && canAllocatePoints)}
                    onClick={() => isLive && canAllocatePoints && actions.allocateAttribute(attrName as AttributeName)}
                    aria-label={`Allocate attribute point to ${attrName}`}
                  >
                    +1
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        <div className={styles.pointsBanner}>
          <span>AVAILABLE STAT POINTS</span>
          <b className={canAllocatePoints ? styles.hasPoints : ""}>{availablePoints ?? "—"}</b>
          <TelemetryBadge
            observation={availablePointsObservation}
            displayAuthority={availablePointsAuthority}
            selectedSequence={sequence}
            onClick={() => availablePointsObservation && onInspectObservation(availablePointsObservation)}
          />
        </div>
      </Panel>
    </>
  );
}
