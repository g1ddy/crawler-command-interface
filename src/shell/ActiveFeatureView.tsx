import { useMemo } from "react";
import type { CrawlerEvent, CrawlerState, InventoryItem, ProjectedEquipmentObservation, ProjectedItemObservation, ProjectedObservationsState, ProjectedObservationValue, TimelineSource } from "../../app/domain/types";
import { deriveNotificationPresentation } from "../application/notification-presentation";
import { deriveRatingsPresentation } from "../application/ratings-presentation";
import { CrawlerView } from "../features/crawler/CrawlerView";
import { deriveAwardHistory } from "../features/inventory/public";
import { InventoryView } from "../features/inventory/InventoryView";
import { NotificationsView } from "../features/notifications/NotificationsView";
import { PartyView } from "../features/party/PartyView";
import { PetView } from "../features/pet/PetView";
import { QuestsView } from "../features/quests/QuestsView";
import { RatingsView } from "../features/ratings/RatingsView";
import { SkillsView } from "../features/skills/SkillsView";
import type { RootView } from "./navigation/navigation-model";
import type { ApplicationActions, EquipmentSlot } from "../application/crawler-action-contracts";

export function ActiveFeatureView({ view, state, observations, events, sequence, isLive, provenanceItem, setProvenanceItem, inventoryFilter, setInventoryFilter, equipmentSlot, setEquipmentSlot, onNavigateToSequence, actions, onInspectObservation, onInspectStat }: {
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
  const awards = useMemo(
    () => deriveAwardHistory(events, sequence, state.inventory),
    [events, sequence, state.inventory],
  );
  const ratings = useMemo(
    () => deriveRatingsPresentation(observations.broadcast, isLive),
    [observations.broadcast, isLive],
  );
  const notifications = useMemo(
    () => deriveNotificationPresentation(events, sequence),
    [events, sequence],
  );

  switch (view) {
    case "crawler": return <CrawlerView state={state} observations={observations} isLive={isLive} onInspectStat={onInspectStat} onInspectObservation={onInspectObservation} actions={actions.crawler} />;
    case "ratings": return <RatingsView presentation={ratings} selectedSequence={sequence} onInspectObservation={onInspectObservation} />;
    case "party": return <PartyView party={state.party} />;
    case "pet": return <PetView pets={state.pets} />;
    case "notifications": return <NotificationsView notifications={notifications} onNavigateToSequence={onNavigateToSequence} />;
    case "inventory": return (
      <InventoryView
        inventory={state.inventory}
        equippedSlots={state.equippedSlots}
        observations={{
          inventory: observations.inventory,
          equipment: observations.equipment,
        }}
        awards={awards}
        events={events}
        selectedSequence={sequence}
        isLive={isLive}
        crawler={state.crawler}
        provenanceItem={provenanceItem}
        setProvenanceItem={setProvenanceItem}
        filter={inventoryFilter}
        setFilter={setInventoryFilter}
        slot={equipmentSlot}
        setSlot={setEquipmentSlot}
        onNavigateToSequence={onNavigateToSequence}
        actions={actions.inventory}
        onInspectObservation={onInspectObservation}
      />
    );
    case "skills": return <SkillsView state={state} isLive={isLive} actions={actions.skills} />;
    case "quests": return <QuestsView quests={state.quests} />;
  }
}
