import type { CrawlerEvent, CrawlerState, ProjectedObservationsState } from "../../../app/domain/types";
import type { RootView } from "./RootNavigation";
export type RootCapabilities = Record<RootView, boolean>;
export const ROOT_VIEW_ORDER: RootView[] = ["crawler", "inventory", "skills", "quests", "ratings", "notifications"];
export function selectedSequenceCapabilities(state: CrawlerState, observations: ProjectedObservationsState, events: CrawlerEvent[], sequence: number): RootCapabilities {
  return { crawler: true, inventory: true, skills: true, quests: state.quests.length > 0, ratings: Object.keys(observations.broadcast).length > 0, notifications: events.some(event => event.sequence <= sequence && event.notificationDelivery?.delivered === true) };
}
export function resolveRootView(view: RootView, capabilities: RootCapabilities): RootView { return capabilities[view] ? view : "crawler"; }
