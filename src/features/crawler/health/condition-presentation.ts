import type { ActiveEffect } from "../../../../app/domain/types";
export function groupConditions(effects?: ActiveEffect[]): {
  injuries: ActiveEffect[];
  beneficial: ActiveEffect[];
  harmful: ActiveEffect[];
  other: ActiveEffect[];
  status: "known-empty" | "established" | "unavailable";
} {
  const safeEffects = effects ?? [];
  const status: "known-empty" | "established" | "unavailable" =
    effects === undefined
      ? "unavailable"
      : effects.length === 0
      ? "known-empty"
      : "established";

  return {
    injuries: safeEffects.filter((effect) => effect.type === "injury"),
    beneficial: safeEffects.filter((effect) => effect.type === "good"),
    harmful: safeEffects.filter((effect) => effect.type === "bad"),
    other: safeEffects.filter((effect) => effect.type === "other"),
    status,
  };
}
