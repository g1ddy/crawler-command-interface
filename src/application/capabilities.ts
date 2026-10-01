import type {
  CrawlerEvent,
  CrawlerState,
  ProjectedObservationsState,
} from "../../app/domain/types";

export type CanonCapability =
  | "crawler"
  | "inventory"
  | "skills"
  | "quests"
  | "ratings"
  | "party"
  | "pet"
  | "notifications";

export type CanonCapabilities = Record<CanonCapability, boolean>;

export interface CapabilityEvaluationInput {
  state: CrawlerState;
  observations: ProjectedObservationsState;
  events: CrawlerEvent[];
  sequence: number;
}

export function evaluateCanonCapabilities(
  input: CapabilityEvaluationInput,
): CanonCapabilities {
  const { state, observations, events, sequence } = input;
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
