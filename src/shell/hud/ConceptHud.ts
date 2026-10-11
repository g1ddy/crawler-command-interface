import { createElement } from "react";
import type { CrawlerState, ProjectedCountdownState } from "../../../app/domain/types";
import type { HudCompositionModel } from "./public.ts";
import { formatFloorDisplay } from "./hud-composition.ts";
import {
  deriveCountdownEvidencePresentation,
  evidenceGlanceMarker,
} from "../../features/timeline/evidence/evidencePresentation.ts";
import { Hotlist } from "./hotlist/Hotlist.ts";

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

  return createElement(
    "header",
    { className: "system-hud", "aria-label": "Crawler HUD", "data-hud-renderer": "concept" },
    createElement(
      "div",
      {
        className: "hud-collapse",
        "data-evidence": activeCountdown?.isStale ? "stale" : activeCountdown?.status ?? "unavailable",
      },
      /* Row 1 — floor orientation and attention */
      createElement(
        "div",
        { style: { display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" } },
        createElement("span", { className: "hud-kicker" }, title),
        createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: "0.5rem" } },
          attention?.hasActiveAlerts
            ? createElement(
                "span",
                { style: { color: "#ef4444", fontWeight: 800, fontSize: "0.75rem" } },
                "⚠️ ALERT"
              )
            : null,
          attention && attention.currentSequenceNotificationCount > 0
            ? createElement(
                "span",
                {
                  "data-testid": "concept-hud-notice-count",
                  style: { color: "#38bdf8", fontWeight: 800, fontSize: "0.75rem", fontFamily: "monospace" },
                },
                `${attention.currentSequenceNotificationCount} NOTICE${
                  attention.currentSequenceNotificationCount === 1 ? "" : "S"
                }`
              )
            : null
        )
      ),

      /* Row 2 — countdown/evidence and progression */
      createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            width: "100%",
            marginTop: "0.25rem",
          },
        },
        activeCountdown
          ? (() => {
              const evidence = deriveCountdownEvidencePresentation(activeCountdown);
              const marker = evidenceGlanceMarker(evidence.state);
              const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
              const ariaLabel = `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`;
              return createElement(
                "div",
                { style: { display: "flex", alignItems: "baseline", gap: "0.5rem" } },
                createElement("strong", null, activeCountdown.formattedTime),
                isInspectable
                  ? createElement("button", { type: "button", onClick: onInspectCountdown, "aria-label": ariaLabel }, marker)
                  : createElement("span", { role: "img", "aria-label": ariaLabel }, marker)
              );
            })()
          : createElement("div", null),
        createElement("span", { style: { fontFamily: "monospace", fontWeight: 700 } }, levelDisplay)
      )
    ),
    createElement(Hotlist, { hotlist: state.hotlist, skills: state.skills })
  );
}
