import type { ProjectedCountdownState, Skill } from "../../../app/domain/types";
import { Hotlist } from "./hotlist/Hotlist";

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
  isLive: boolean;
  sequence: number;
  occurredAt: string;
  hotlist: string[];
  skills: Skill[];
  onReturnToLive: () => void;
}

function countdownLabel(countdown: ProjectedCountdownState | null): string {
  if (!countdown) return "COLLAPSE TIME UNAVAILABLE";
  if (countdown.isStale) return `LATEST SOURCED COLLAPSE TIME: ${countdown.formattedTime.toUpperCase()}`;
  if (countdown.lifecycleStatus === "scheduled") return `COLLAPSE SCHEDULED · ${countdown.formattedTime.toUpperCase()}`;
  if (countdown.lifecycleStatus === "active") return `LEVEL COLLAPSE IN ${countdown.formattedTime.toUpperCase()}`;
  return `${countdown.title.toUpperCase()} · ${countdown.formattedTime.toUpperCase()}`;
}

export function PersistentHud(props: PersistentHudProps) {
  return <>
    <div className="mobile-status-bar">
      <div className="mobile-crawler-info"><b>{props.crawlerName}</b> (LVL {props.level} {props.crawlerClass || "CLASS UNKNOWN"})</div>
      <div className="mobile-meters"><span className="hp-mini">HP {props.health}/{props.maxHealth}</span><span className="mp-mini">MP {props.mana}/{props.maxMana}</span></div>
      <div className="mobile-mode">{props.isLive ? <span className="live-pill">● LIVE</span> : <span className="replay-pill">↺ SEQ #{props.sequence}</span>}</div>
    </div>
    <div className="timer">
      <span>{props.floorTitle.toUpperCase()}</span>
      <b title={props.countdown ? `${props.countdown.status} · ${props.countdown.basis}` : "No countdown is sourced at this replay point"}>{countdownLabel(props.countdown)}</b>
      <span data-testid="hud-audience-mode">{props.isLive ? "● LIVE" : "↺ REPLAY"} · {props.viewers.toLocaleString()} VIEWERS</span>
    </div>
    <Hotlist hotlist={props.hotlist} skills={props.skills} />
    {!props.isLive && <div className="replay-banner"><span>HISTORICAL VIEW · REPLAYING SEQUENCE #{props.sequence} ({props.occurredAt})</span><button onClick={props.onReturnToLive}>RETURN TO LIVE ⚡</button></div>}
  </>;
}
