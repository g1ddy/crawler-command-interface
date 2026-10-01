import type { CanonCapabilities } from "../../application/capabilities";
import { ROOT_VIEW_ORDER, type RootView } from "./navigation-model.ts";

export function availableRootViews(capabilities: CanonCapabilities): RootView[] {
  return ROOT_VIEW_ORDER.filter((view) => capabilities[view]);
}

export function resolveRootView(view: RootView, capabilities: CanonCapabilities): RootView {
  return capabilities[view] ? view : "crawler";
}
