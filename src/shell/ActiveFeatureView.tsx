import type { CrawlerEvent, CrawlerState, InventoryItem, ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationsState, ProjectedObservationValue, TimelineSource } from "../../app/domain/types";
import { CrawlerView } from "../features/crawler/CrawlerView";
import { InventoryView } from "../features/inventory/InventoryView";
import { NotificationsView } from "../features/notifications/NotificationsView";
import { PartyView } from "../features/party/PartyView";
import { QuestsView } from "../features/quests/QuestsView";
import { RatingsView } from "../features/ratings/RatingsView";
import { SkillsView } from "../features/skills/SkillsView";
import type { RootView } from "./navigation/navigation-model";

export function ActiveFeatureView({ view, state, liveState, observations, sources, events, sequence, isLive, provenanceItem, setProvenanceItem, inventoryFilter, setInventoryFilter, equipmentSlot, setEquipmentSlot, onNavigateToSequence, onEmitEvent, onInspectObservation, onInspectStat }: {
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
  equipmentSlot: string;
  setEquipmentSlot: (slot: string) => void;
  onNavigateToSequence: (sequence: number) => void;
  onEmitEvent: (event: Partial<CrawlerEvent>) => void;
  onInspectObservation: (observation: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
  onInspectStat: (stat: string) => void;
}) {
  switch (view) {
    case "crawler": return <CrawlerView state={state} observations={observations} onInspectStat={onInspectStat} onInspectObservation={onInspectObservation} onEmitEvent={onEmitEvent} />;
    case "ratings": return <RatingsView observations={observations.broadcast} isLive={isLive} onInspectObservation={onInspectObservation} />;
    case "party": return <PartyView party={state.party} />;
    case "notifications": return <NotificationsView events={events} sequence={sequence} onNavigateToSequence={onNavigateToSequence} />;
    case "inventory": return <InventoryView state={state} liveState={liveState} observations={observations} sources={sources} events={events} sequence={sequence} provenanceItem={provenanceItem} setProvenanceItem={setProvenanceItem} filter={inventoryFilter} setFilter={setInventoryFilter} slot={equipmentSlot} setSlot={setEquipmentSlot} onNavigateToSequence={onNavigateToSequence} onEmitEvent={onEmitEvent} onInspectObservation={onInspectObservation} />;
    case "skills": return <SkillsView state={state} onEmitEvent={onEmitEvent} />;
    case "quests": return <QuestsView quests={state.quests} />;
  }
}
