import type { CrawlerState, ProjectedCountdownState } from "../../../app/domain/types";
import type { HudCompositionModel } from "./public";
import { formatFloorDisplay } from "./hud-composition";
import {
  deriveCountdownEvidencePresentation,
  evidenceGlanceMarker,
} from "../../features/timeline/evidence/evidencePresentation";
import { Hotlist } from "./hotlist/Hotlist";

export function ConceptHud({
  composition,
  state,
  countdown,
  floorTitle,
  onInspectCountdown,
}: {
  composition?: HudCompositionModel;
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills" | "crawler">;
  countdown?: ProjectedCountdownState | null;
  floorTitle?: string;
  isLive?: boolean;
  onInspectCountdown?: () => void;
}) {
  const title = formatFloorDisplay(
    composition?.system.floorTitle ?? floorTitle ?? "",
    composition?.system.floorOrdinal
  );
  const activeCountdown = composition?.urgency.activeCountdown ?? countdown;
  const attention = composition?.attention;
  const levelDisplay =
    composition?.progression.valueDisplay ??
    (state.crawler?.level != null ? `LVL ${state.crawler.level}` : "LVL —");

  return (
    <header className="system-hud" aria-label="Crawler HUD" data-hud-renderer="concept">
      <div
        className="hud-collapse"
        data-evidence={activeCountdown?.isStale ? "stale" : activeCountdown?.status ?? "unavailable"}
      >
        {/* Row 1 — floor orientation and attention */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span className="hud-kicker">{title}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {attention?.hasActiveAlerts && (
              <span style={{ color: "#ef4444", fontWeight: 800, fontSize: "0.75rem" }}>
                ⚠️ ALERT
              </span>
            )}
            {attention && attention.totalNotificationsCount > 0 && (
              <span
                data-testid="concept-hud-notice-count"
                style={{ color: "#38bdf8", fontWeight: 800, fontSize: "0.75rem", fontFamily: "monospace" }}
              >
                {attention.totalNotificationsCount} NOTICE{attention.totalNotificationsCount === 1 ? "" : "S"}
              </span>
            )}
          </div>
        </div>

        {/* Row 2 — countdown/evidence and progression */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "0.25rem" }}>
          {activeCountdown ? (() => {
            const evidence = deriveCountdownEvidencePresentation(activeCountdown);
            const marker = evidenceGlanceMarker(evidence.state);
            const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
            const ariaLabel = `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`;
            return (
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }}>
                <strong>{activeCountdown.formattedTime}</strong>
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
