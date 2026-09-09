import type { CrawlerEvent, CrawlerState, ProjectedObservationsState } from "../../../app/domain/types";
import { ROOT_VIEW_ORDER, type RootView } from "./navigation-model.ts";

export type RootCapabilities = Record<RootView, boolean>;

export function availableRootViews(capabilities: RootCapabilities): RootView[] {
  return ROOT_VIEW_ORDER.filter((view) => capabilities[view]);
}

export function selectedSequenceCapabilities(
  state: CrawlerState,
  observations: ProjectedObservationsState,
  events: CrawlerEvent[],
  sequence: number,
): RootCapabilities {
  return {
    crawler: true,
    inventory: true,
    skills: true,
    quests: state.quests.length > 0,
    ratings: Object.keys(observations.broadcast).length > 0,
    party: Boolean(state.party && state.party.members.length >= 2),
    pet: Boolean(state.pets && state.pets.some((p) => p.bondState === "bonded")),
    notifications: events.some(
      (event) => event.sequence <= sequence && event.notificationDelivery?.delivered === true,
    ),
  };
}

export function resolveRootView(view: RootView, capabilities: RootCapabilities): RootView {
  return capabilities[view] ? view : "crawler";
}
