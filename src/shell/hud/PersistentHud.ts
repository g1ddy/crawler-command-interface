import { createElement } from "react";
import type {
  CrawlerState,
  ProjectedCountdownState,
} from "../../../app/domain/types.ts";
import type { HudCompositionModel } from "./public.ts";
import { formatFloorDisplay } from "./hud-composition.ts";
import {
  deriveCountdownEvidencePresentation,
  evidenceGlanceMarker,
} from "../../features/timeline/public.ts";
import { Hotlist } from "./hotlist/Hotlist.ts";

let styles: Record<string, string> = {
  hud: "hud",
  masthead: "masthead",
  row: "row",
  floorTitle: "floorTitle",
  attention: "attention",
  alertIndicator: "alertIndicator",
  noticeIndicator: "noticeIndicator",
  urgency: "urgency",
  countdownContainer: "countdownContainer",
  evidenceButton: "evidenceButton",
  evidenceMarker: "evidenceMarker",
  level: "level",
};

try {
  const cssModule = await (import("./PersistentHud.module.css") as Promise<{ default: Record<string, string> }>);
  if (cssModule && cssModule.default) {
    styles = cssModule.default;
  }
} catch {
  // Node test runner environment without CSS module transformer
}

/**
 * Persistent HUD renderer consuming the renderer-neutral composition contract.
 * Exposes persistent masthead context (floor title, notification attention, countdown clock, crawler level)
 * while crawler identity, progression details, and vitals are owned by feature views.
 */
export function PersistentHud({
  composition,
  state,
  countdown,
  floorTitle,
  onInspectCountdown,
}: {
  composition?: HudCompositionModel;
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills">;
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
  const levelDisplay = composition?.progression.valueDisplay ?? "LVL —";

  return createElement(
    "header",
    {
      className: styles.hud,
      "aria-label": "Crawler HUD",
      "data-hud-composition": "persistent",
      "data-hud-renderer": "persistent",
    },
    createElement(
      "div",
      { className: styles.masthead },
      /* Row 1 — floor orientation and attention */
      createElement(
        "div",
        { className: styles.row },
        createElement("div", { className: styles.floorTitle }, title),
        createElement(
          "div",
          { className: styles.attention },
          attention?.hasActiveAlerts
            ? createElement("span", { className: styles.alertIndicator }, "⚠ ALERT")
            : null,
          attention && attention.currentSequenceNotificationCount > 0
            ? createElement(
                "span",
                { className: styles.noticeIndicator },
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
        { className: styles.row },
        createElement(
          "div",
          { className: styles.urgency },
          activeCountdown
            ? (() => {
                const evidence = deriveCountdownEvidencePresentation(activeCountdown);
                const marker = evidenceGlanceMarker(evidence.state);
                const isInspectable = evidence.inspectable && Boolean(onInspectCountdown);
                const ariaLabel = `Inspect collapse clock evidence: ${evidence.label.toLowerCase()}`;
                return createElement(
                  "div",
                  { className: styles.countdownContainer },
                  createElement("strong", null, activeCountdown.formattedTime),
                  isInspectable
                    ? createElement(
                        "button",
                        {
                          type: "button",
                          onClick: onInspectCountdown,
                          "aria-label": ariaLabel,
                          className: styles.evidenceButton,
                        },
                        marker
                      )
                    : createElement(
                        "span",
                        {
                          role: "img",
                          "aria-label": ariaLabel,
                          className: styles.evidenceMarker,
                        },
                        marker
                      )
                );
              })()
            : null
        ),
        createElement("div", { className: styles.level }, levelDisplay)
      )
    ),
    createElement(Hotlist, { hotlist: state.hotlist, skills: state.skills })
  );
}
