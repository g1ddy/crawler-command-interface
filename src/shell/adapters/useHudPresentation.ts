import { useCallback, useState } from "react";
import { resolveHudPresentation, type HudPresentation } from "../hud/hud-presentation";

/** URL binding only; persistence is fixed by the host when the session starts. */
export function useHudPresentation(prop: HudPresentation) {
  const [selection, setSelection] = useState(() => {
    const query = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("hud");
    return { prop, choice: query ? resolveHudPresentation(query) : prop };
  });
  const choice = selection.prop === prop ? selection.choice : prop;
  const select = useCallback((next: HudPresentation) => {
    setSelection({ prop, choice: next });
    const url = new URL(window.location.href);
    if (next === "production") url.searchParams.delete("hud");
    else url.searchParams.set("hud", next);
    window.history.replaceState(null, "", url);
  }, [prop]);
  return [choice, select] as const;
}
