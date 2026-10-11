import type { CrawlerState, ProjectedCountdownState } from "../../../app/domain/types";
import {
  deriveCountdownEvidencePresentation,
  evidenceGlanceMarker,
} from "../../features/timeline/evidence/evidencePresentation";
import { Hotlist } from "./hotlist/Hotlist";

export function ConceptHud({
  state,
  countdown,
  floorTitle,
  onInspectCountdown,
}: {
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills" | "crawler">;
  countdown: ProjectedCountdownState | null;
  floorTitle: string;
  isLive?: boolean;
  onInspectCountdown?: () => void;
}) {
  const levelDisplay =
    state.crawler?.level != null ? `LVL ${state.crawler.level}` : "LVL —";

  return (
    <header className="system-hud" aria-label="Crawler HUD" data-hud-renderer="concept">
      <div className="hud-collapse" data-evidence={countdown?.isStale ? "stale" : countdown?.status ?? "unavailable"}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span className="hud-kicker">{floorTitle}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "0.25rem" }}>
          {countdown ? (() => {
            const evidence = deriveCountdownEvidencePresentation(countdown);
            const marker = evidenceGlanceMarker(evidence.state);
            const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
            const ariaLabel = `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`;
            return (
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <strong>{countdown.formattedTime}</strong>
                {isInspectable ? (
                  <button type="button" onClick={onInspectCountdown} aria-label={ariaLabel}>
                    {marker}
                  </button>
                ) : (
                  <span role="img" aria-label={ariaLabel}>
                    {marker}
                  </span>
                )}
              </div>
            );
          })() : <div />}
          <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{levelDisplay}</span>
        </div>
      </div>
      <Hotlist hotlist={state.hotlist} skills={state.skills} />
    </header>
  );
}
