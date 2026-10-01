import type { ActiveEffect } from "../../../../app/domain/types";
export function groupConditions(effects: ActiveEffect[]) {
  return { injuries: effects.filter(effect => effect.type === "injury"), beneficial: effects.filter(effect => effect.type === "good"), harmful: effects.filter(effect => effect.type === "bad"), other: effects.filter(effect => effect.type === "other") };
}
