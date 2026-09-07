import { useMemo, useState } from "react";
import type {
  CrawlerEvent,
  CrawlerState,
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationsState,
  ProjectedObservationValue,
  TimelineSource,
} from "../../../app/domain/types";
import { checkItemRequirements } from "../../../app/domain/stats";
import { deriveAwardHistory } from "./awardHistory";
import { EquipmentView } from "./equipment/EquipmentView";
import { ItemProvenanceDrawer } from "./provenance/ItemProvenanceDrawer";
import { InventoryCategories } from "./InventoryCategories";
import { InventoryAwardsView } from "./InventoryAwardsView";
import { InventoryItemBrowser } from "./InventoryItemBrowser";
import { EquippedGearSummary } from "./EquippedGearSummary";
import { ItemInspector } from "./ItemInspector";
import {
  resolveSelectedInventoryItem,
  visibleInventoryItems,
  type InventorySortOrder,
} from "./inventoryItemBrowserModel";

export function InventoryView({
  state,
  liveState,
  observations,
  events,
  sequence,
  provenanceItem,
  setProvenanceItem,
  filter,
  setFilter,
  slot,
  setSlot,
  onNavigateToSequence,
  onEmitEvent,
  onInspectObservation,
}: {
  state: CrawlerState;
  liveState: CrawlerState;
  observations: ProjectedObservationsState;
  sources?: TimelineSource[];
  events: CrawlerEvent[];
  sequence: number;
  provenanceItem: InventoryItem | null;
  setProvenanceItem: (item: InventoryItem | null) => void;
  filter: string;
  setFilter: (f: string) => void;
  slot: string;
  setSlot: (s: string) => void;
  onNavigateToSequence: (seq: number) => void;
  onEmitEvent: (evt: Partial<CrawlerEvent>) => void;
  onInspectObservation: (
    obs:
      | ProjectedObservationValue
      | ProjectedItemObservation
      | ProjectedEquipmentObservation,
  ) => void;
}) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(
    null,
  );
  const [sortOrder, setSortOrder] = useState<InventorySortOrder>("newest");
  const [search, setSearch] = useState("");

  const items = state.inventory;
  const awards = useMemo(
    () => deriveAwardHistory(events, sequence, state.inventory),
    [events, sequence, state.inventory],
  );
  const effectiveFilter = filter;

  const visibleItems = useMemo(
    () => visibleInventoryItems(items, effectiveFilter, search, sortOrder),
    [items, effectiveFilter, search, sortOrder],
  );
  const selectedItem = useMemo(
    () => resolveSelectedInventoryItem(visibleItems, selectedInstanceId),
    [visibleItems, selectedInstanceId],
  );

  const selectedItemRequirements = useMemo(
    () => checkItemRequirements(liveState.crawler, selectedItem?.requirements),
    [liveState.crawler, selectedItem],
  );

  const selectedItemObservation = selectedItem
    ? observations.inventory[selectedItem.instanceId]
    : undefined;

  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">STORAGE SYSTEM</p>
          <h1>INVENTORY</h1>
        </div>
        <b>
          {items.length} SOURCED ITEM{items.length === 1 ? "" : "S"}
        </b>
      </header>
      <div className="inventory">
        <InventoryCategories
          items={items}
          awardsCount={awards.length}
          filter={effectiveFilter}
          setFilter={setFilter}
        />

        {effectiveFilter === "AWARDS / BOXES" ? (
          <InventoryAwardsView awards={awards} />
        ) : effectiveFilter !== "EQUIPMENT" ? (
          <>
            <InventoryItemBrowser
              visibleItems={visibleItems}
              observations={observations}
              filter={effectiveFilter}
              search={search}
              setSearch={setSearch}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              selectedInstanceId={selectedItem?.instanceId ?? null}
              setSelectedInstanceId={setSelectedInstanceId}
            />
            <div className="right">
              <EquippedGearSummary state={state} setFilter={setFilter} />

              {selectedItem && (
                <ItemInspector
                  selectedItem={selectedItem}
                  observation={selectedItemObservation}
                  requirementResult={selectedItemRequirements}
                  onEmitEvent={onEmitEvent}
                  onOpenProvenance={(item) => setProvenanceItem(item)}
                  onInspectObservation={onInspectObservation}
                />
              )}

              {provenanceItem && (
                <ItemProvenanceDrawer
                  item={provenanceItem}
                  events={events}
                  onClose={() => setProvenanceItem(null)}
                  onNavigateToSequence={onNavigateToSequence}
                />
              )}
            </div>
          </>
        ) : (
          <EquipmentView
            state={state}
            liveState={liveState}
            observations={observations}
            slot={slot}
            setSlot={setSlot}
            onEmitEvent={onEmitEvent}
            onOpenProvenance={(item) => setProvenanceItem(item)}
            onInspectObservation={onInspectObservation}
          />
        )}
      </div>
    </section>
  );
}
