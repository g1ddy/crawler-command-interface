import { createElement } from "react";
import type {
  CrawlerState,
  ProjectedCountdownState,
} from "../../../app/domain/types.ts";
import type { HudCompositionModel } from "./public.ts";
import { formatFloorDisplay, deriveNotificationAccessibleLabel } from "./hud-composition.ts";
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
  attentionButton: "attentionButton",
  noticeBadge: "noticeBadge",
  alertBadge: "alertBadge",
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
  onOpenNotifications,
}: {
  composition?: HudCompositionModel;
  state: Pick<CrawlerState, "sequence" | "hotlist" | "skills">;
  countdown?: ProjectedCountdownState | null;
  floorTitle?: string;
  isLive?: boolean;
  onInspectCountdown?: () => void;
  onOpenNotifications?: () => void;
}) {
  const title = formatFloorDisplay(
    composition?.system.floorTitle ?? floorTitle ?? "",
    composition?.system.floorOrdinal
  );
  const activeCountdown = composition?.urgency.activeCountdown ?? countdown;
  const attention = composition?.attention;
  const levelDisplay = composition?.progression.valueDisplay ?? "LVL —";

  const count = attention?.currentSequenceNotificationCount ?? 0;
  const hasAlerts = attention?.hasActiveAlerts ?? false;
  const ariaLabel = deriveNotificationAccessibleLabel(attention);

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
          createElement(
            "button",
            {
              type: "button",
              className: styles.attentionButton,
              onClick: onOpenNotifications,
              "aria-label": ariaLabel,
              "data-testid": "notification-bell",
              "data-has-alerts": String(hasAlerts),
              "data-count": String(count),
            },
            createElement(
              "svg",
              {
                width: "16",
                height: "16",
                viewBox: "0 0 24 24",
                fill: "none",
                stroke: "currentColor",
                strokeWidth: "2",
                strokeLinecap: "round",
                strokeLinejoin: "round",
                "aria-hidden": "true",
              },
              createElement("path", { d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
              createElement("path", { d: "M13.73 21a2 2 0 0 1-3.46 0" })
            ),
            count > 0
              ? createElement(
                  "span",
                  {
                    className: styles.noticeBadge,
                    "aria-hidden": "true",
                    "data-testid": "notification-count-badge",
                  },
                  String(count)
                )
              : null,
            hasAlerts
              ? createElement(
                  "span",
                  {
                    className: styles.alertBadge,
                    "aria-hidden": "true",
                    "data-testid": "notification-alert-badge",
                  },
                  "⚠"
                )
              : null
          )
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
