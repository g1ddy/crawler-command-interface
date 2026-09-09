export const HUD_CONCEPTS = ["authority", "tactical", "theater"] as const;

export type HudConcept = (typeof HUD_CONCEPTS)[number];
export type HudPresentation = "production" | HudConcept;

export function parseHudConcept(value: string | null): HudConcept | null {
  return HUD_CONCEPTS.find((concept) => concept === value) ?? null;
}

export function resolveHudPresentation(value: string | null): HudPresentation {
  return parseHudConcept(value) ?? "production";
}
