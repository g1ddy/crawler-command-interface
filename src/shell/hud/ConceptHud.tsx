import type { CrawlerState, ProjectedCountdownState } from "../../../app/domain/types";
import type { HudCompositionModel } from "./public";
import { formatFloorDisplay, deriveNotificationAccessibleLabel } from "./hud-composition";
import {
  deriveCountdownEvidencePresentation,
  evidenceGlanceMarker,
} from "../../features/timeline/evidence/evidencePresentation";
import { Hotlist } from "./hotlist/Hotlist";

/** Experimental renderer sharing the same source-backed masthead contract. */
export function ConceptHud({
  composition,
  state,
  countdown,
  floorTitle,
  onInspectCountdown,
  onOpenNotifications,
}: {
  composition?: HudCompositionModel;
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills" | "crawler">;
  countdown?: ProjectedCountdownState | null;
  floorTitle?: string;
  isLive?: boolean;
  onInspectCountdown?: () => void;
  onOpenNotifications?: () => void;
}) {
  const title = formatFloorDisplay(
    composition?.system.floorTitle ?? floorTitle ?? "",
    composition?.system.floorOrdinal,
  );
  const activeCountdown = composition?.urgency.activeCountdown ?? countdown;
  const attention = composition?.attention;
  const levelDisplay =
    composition?.progression.valueDisplay ??
    (state.crawler?.level != null ? `LVL ${state.crawler.level}` : "LVL —");
  const count = attention?.currentSequenceNotificationCount ?? 0;
  const hasAlerts = attention?.hasActiveAlerts ?? false;
  const ariaLabel = deriveNotificationAccessibleLabel(attention);

  return (
    <header className="system-hud" aria-label="Crawler HUD" data-hud-renderer="concept">
      <div className="hud-collapse" data-evidence={activeCountdown?.isStale ? "stale" : activeCountdown?.status ?? "unavailable"}>
        <div className="hud-masthead-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
          <span className="hud-kicker" data-testid="arwes-location-info">{title}</span>
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label={ariaLabel}
            data-testid="notification-bell"
            data-has-alerts={String(hasAlerts)}
            data-count={String(count)}
            style={{
              position: "relative",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "44px",
              height: "44px",
              minWidth: "44px",
              minHeight: "44px",
              padding: 0,
              background: "rgba(15, 23, 42, 0.6)",
              border: hasAlerts ? "1px solid rgba(239, 68, 68, 0.5)" : "1px solid rgba(148, 163, 184, 0.25)",
              borderRadius: "4px",
              color: hasAlerts ? "#ef4444" : "#94a3b8",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {count > 0 && (
              <span data-testid="concept-hud-notice-count" aria-hidden="true" style={{ position: "absolute", top: "1px", right: "1px", background: "#0284c7", color: "#ffffff", fontSize: "0.65rem", fontWeight: 800, fontFamily: "monospace", padding: "1px 4px", borderRadius: "8px", lineHeight: 1 }}>
                {count}
              </span>
            )}
            {hasAlerts && (
              <span data-testid="notification-alert-badge" aria-hidden="true" style={{ position: "absolute", bottom: "1px", right: "1px", color: "#ef4444", fontSize: "0.65rem", fontWeight: 800, lineHeight: 1 }}>
                ⚠
              </span>
            )}
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "0.25rem" }}>
          {activeCountdown ? (() => {
            const evidence = deriveCountdownEvidencePresentation(activeCountdown);
            const marker = evidenceGlanceMarker(evidence.state);
            const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
            const evidenceLabel = `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`;
            return (
              <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem" }} data-testid="arwes-countdown-timer">
                <strong>{activeCountdown.formattedTime}</strong>
                {isInspectable ? (
                  <button type="button" onClick={onInspectCountdown} aria-label={evidenceLabel} data-testid="arwes-countdown-badge">{marker}</button>
                ) : (
                  <span role="img" aria-label={evidenceLabel} data-testid="arwes-countdown-badge">{marker}</span>
                )}
              </div>
            );
          })() : <div />}
          <span data-testid="persistent-level" style={{ fontFamily: "monospace", fontWeight: 700, whiteSpace: "nowrap" }}>{levelDisplay}</span>
        </div>
      </div>
      <Hotlist hotlist={state.hotlist} skills={state.skills} />
    </header>
  );
}
