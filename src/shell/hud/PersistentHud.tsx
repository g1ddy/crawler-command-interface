import type { ProjectedCountdownState } from "../../../app/domain/types";

interface PersistentHudProps {
  crawlerName: string;
  crawlerClass?: string;
  level: number;
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  viewers: number;
  floorTitle: string;
  countdown: ProjectedCountdownState | null;
  fallbackCountdown: string;
  isLive: boolean;
  sequence: number;
  occurredAt: string;
  onReturnToLive: () => void;
}

export function PersistentHud(props: PersistentHudProps) {
  const { countdown } = props;
  const countdownLabel = countdown?.isStale
    ? `LATEST SOURCED COLLAPSE TIME: ${countdown.formattedTime.toUpperCase()}`
    : countdown?.lifecycleStatus === "scheduled"
      ? countdown.formattedTime.toUpperCase()
      : `LEVEL COLLAPSE IN ${countdown ? countdown.formattedTime.toUpperCase() : props.fallbackCountdown}`;

  return <>
    <div className="mobile-status-bar">
      <div className="mobile-crawler-info"><b>{props.crawlerName}</b> (LVL {props.level} {props.crawlerClass || "CLASS UNKNOWN"})</div>
      <div className="mobile-meters"><span className="hp-mini">HP {props.health}/{props.maxHealth}</span><span className="mp-mini">MP {props.mana}/{props.maxMana}</span></div>
      <div className="mobile-mode">{props.isLive ? <span className="live-pill">● LIVE</span> : <span className="replay-pill">↺ SEQ #{props.sequence}</span>}</div>
    </div>
    <div className="timer">
      <span>{props.floorTitle.toUpperCase()}</span>
      <b title={countdown ? `${countdown.status} · ${countdown.basis}` : undefined}>{countdownLabel}</b>
      <span>● LIVE · {props.viewers.toLocaleString()} VIEWERS</span>
    </div>
    {!props.isLive && <div className="replay-banner"><span>HISTORICAL VIEW · REPLAYING SEQUENCE #{props.sequence} ({props.occurredAt})</span><button onClick={props.onReturnToLive}>RETURN TO LIVE ⚡</button></div>}
  </>;
}
