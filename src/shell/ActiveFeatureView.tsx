import type { CrawlerEvent, CrawlerState, InventoryItem, ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationsState, ProjectedObservationValue, TimelineSource } from "../../app/domain/types";
import { CrawlerView } from "../features/crawler/CrawlerView";
import { InventoryView } from "../features/inventory/InventoryView";
import { NotificationsView } from "../features/notifications/NotificationsView";
import { PartyView } from "../features/party/PartyView";
import { PetView } from "../features/pet/PetView";
import { QuestsView } from "../features/quests/QuestsView";
import { RatingsView } from "../features/ratings/RatingsView";
import { SkillsView } from "../features/skills/SkillsView";
import type { RootView } from "./navigation/navigation-model";
import type { ApplicationActions, EquipmentSlot } from "../application/crawler-actions";

export function ActiveFeatureView({ view, state, liveState, observations, sources, events, sequence, isLive, provenanceItem, setProvenanceItem, inventoryFilter, setInventoryFilter, equipmentSlot, setEquipmentSlot, onNavigateToSequence, actions, onInspectObservation, onInspectStat }: {
  view: RootView;
  state: CrawlerState;
  liveState: CrawlerState;
  observations: ProjectedObservationsState;
  sources: TimelineSource[];
  events: CrawlerEvent[];
  sequence: number;
  isLive: boolean;
  provenanceItem: InventoryItem | null;
  setProvenanceItem: (item: InventoryItem | null) => void;
  inventoryFilter: string;
  setInventoryFilter: (filter: string) => void;
  equipmentSlot: EquipmentSlot;
  setEquipmentSlot: (slot: EquipmentSlot) => void;
  onNavigateToSequence: (sequence: number) => void;
  actions: ApplicationActions;
  onInspectObservation: (observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
  onInspectStat: (stat: string) => void;
}) {
  switch (view) {
    case "crawler": return <CrawlerView state={state} observations={observations} onInspectStat={onInspectStat} onInspectObservation={onInspectObservation} actions={actions.crawler} />;
    case "ratings": return <RatingsView observations={observations.broadcast} isLive={isLive} onInspectObservation={onInspectObservation} />;
    case "party": return <PartyView party={state.party} />;
    case "pet": return <PetView pets={state.pets} />;
    case "notifications": return <NotificationsView events={events} sequence={sequence} onNavigateToSequence={onNavigateToSequence} />;
    case "inventory": return <InventoryView state={state} liveState={liveState} observations={observations} sources={sources} events={events} sequence={sequence} provenanceItem={provenanceItem} setProvenanceItem={setProvenanceItem} filter={inventoryFilter} setFilter={setInventoryFilter} slot={equipmentSlot} setSlot={setEquipmentSlot} onNavigateToSequence={onNavigateToSequence} actions={actions.inventory} onInspectObservation={onInspectObservation} />;
    case "skills": return <SkillsView state={state} actions={actions.skills} />;
    case "quests": return <QuestsView quests={state.quests} />;
  }
}
