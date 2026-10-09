import type { ActiveEffect } from "../../../../app/domain/types";
export function groupConditions(effects?: ActiveEffect[]) {
  const safeEffects = effects ?? [];
  return {
    injuries: safeEffects.filter((effect) => effect.type === "injury"),
    beneficial: safeEffects.filter((effect) => effect.type === "good"),
    harmful: safeEffects.filter((effect) => effect.type === "bad"),
    other: safeEffects.filter((effect) => effect.type === "other"),
    isUnavailable: effects === undefined,
    hasBeenEstablished: effects !== undefined,
  };
}
