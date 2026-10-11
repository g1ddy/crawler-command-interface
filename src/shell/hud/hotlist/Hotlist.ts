import { createElement } from "react";
import type { Skill } from "../../../../app/domain/types.ts";
import { deriveHotlistPresentation } from "../../../features/skills/public.ts";

let styles: Record<string, string> = {
  hotlist: "hotlist",
  title: "title",
  slots: "slots",
  slot: "slot",
  slotNumber: "slotNumber",
  icon: "icon",
  label: "label",
};

try {
  const cssModule = await (import("./Hotlist.module.css") as Promise<{ default: Record<string, string> }>);
  if (cssModule && cssModule.default) {
    styles = cssModule.default;
  }
} catch {
  // Node test runner environment without CSS module transformer
}

export function Hotlist({ hotlist, skills }: { hotlist: string[]; skills: Skill[] }) {
  if (hotlist.length === 0) return null;

  const slots = deriveHotlistPresentation(hotlist, skills);

  return createElement(
    "section",
    { className: styles.hotlist, "aria-label": "Hotlist" },
    createElement("b", { className: styles.title }, "HOTLIST"),
    createElement(
      "div",
      { className: styles.slots },
      slots.map((slot) => {
        const { slotIndex, slotNumber, skill, isAssigned } = slot;
        return createElement(
          "span",
          {
            key: slotIndex,
            className: styles.slot,
            "data-assigned": isAssigned,
            title: skill ? `Slot ${slotNumber}: ${skill.name}` : `Slot ${slotNumber}: Empty`,
          },
          createElement("small", { className: styles.slotNumber }, String(slotNumber)),
          createElement("i", { className: styles.icon, "aria-hidden": "true" }, skill?.icon ?? "—"),
          createElement("em", { className: styles.label }, skill?.name ?? "EMPTY")
        );
      })
    )
  );
}
