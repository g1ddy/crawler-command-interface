import { useState } from "react";
import type {
  AttributeName,
  CrawlerEvent,
  EquippedSlotMap,
  InventoryItem,
  ProjectedEquipmentObservation,
  ProjectedItemObservation,
  ProjectedObservationValue,
} from "../../../app/domain/types.ts";
import type { EquipmentSlot, InventoryActions } from "../../application/crawler-action-contracts.ts";
import type { AwardHistoryEntry } from "./awardHistory.ts";
import { EquipmentView } from "./equipment/EquipmentView.tsx";
import { ItemProvenanceDrawer } from "./provenance/ItemProvenanceDrawer.tsx";
import { InventoryCategories } from "./InventoryCategories.tsx";
import { InventoryAwardsView } from "./InventoryAwardsView.tsx";
import { InventoryItemBrowser } from "./InventoryItemBrowser.tsx";
import { EquippedGearSummary } from "./EquippedGearSummary.tsx";
import { ItemInspector } from "./ItemInspector.tsx";
import type { InventorySortOrder } from "./inventoryItemBrowserModel.ts";
import { deriveInventoryPresentation } from "./inventory-presentation.ts";
import { deriveEquipmentPresentation } from "./equipment/equipment-presentation.ts";
import styles from "./InventoryView.module.css";

export function InventoryView({
  inventory,
  equippedSlots,
  observations,
  awards,
  events,
  selectedSequence,
  isLive = true,
  crawler,
  provenanceItem,
  setProvenanceItem,
  filter,
  setFilter,
  slot,
  setSlot,
  onNavigateToSequence,
  actions,
  onInspectObservation,
}: {
  inventory: InventoryItem[];
  equippedSlots: EquippedSlotMap | Record<string, string | null | undefined>;
  observations: {
    inventory: Record<string, ProjectedItemObservation | undefined>;
    equipment: Record<EquipmentSlot, ProjectedEquipmentObservation | undefined>;
  };
  awards: AwardHistoryEntry[];
  events?: CrawlerEvent[];
  selectedSequence?: number;
  isLive?: boolean;
  crawler: { attributes?: Partial<Record<AttributeName, number>>; level?: number; class?: string; race?: string };
  provenanceItem: InventoryItem | null;
  setProvenanceItem: (item: InventoryItem | null) => void;
  filter: string;
  setFilter: (f: string) => void;
  slot: EquipmentSlot;
  setSlot: (s: EquipmentSlot) => void;
  onNavigateToSequence: (seq: number) => void;
  actions: InventoryActions;
  onInspectObservation: (
    obs:
      | ProjectedObservationValue
      | ProjectedItemObservation
      | ProjectedEquipmentObservation,
  ) => void;
}) {
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<InventorySortOrder>("newest");
  const [search, setSearch] = useState("");

  const inventoryPresentation = deriveInventoryPresentation({
    inventory,
    equippedSlots,
    observations: observations.inventory,
    crawler,
    filter,
    search,
    sortOrder,
    selectedInstanceId,
    awards,
    isLive,
  });

  const equipmentPresentation = deriveEquipmentPresentation({
    inventory,
    equippedSlots,
    observations: observations.equipment,
    crawler,
    selectedSlot: slot,
    selectedCandidateId,
    isLive,
  });

  const selectedItem = inventoryPresentation.selectedItem;

  return (
    <section className={styles.viewContent}>
      <header className={styles.title}>
        <div>
          <p className={styles.eyebrow}>STORAGE SYSTEM</p>
          <h1>INVENTORY</h1>
        </div>
        <b className={styles.titleCount}>
          {inventoryPresentation.itemCount} ITEM{inventoryPresentation.itemCount === 1 ? "" : "S"}
        </b>
      </header>
      <div className={styles.inventoryGrid}>
        <InventoryCategories
          categories={inventoryPresentation.categories}
          filter={filter}
          setFilter={setFilter}
        />

        {filter === "AWARDS / BOXES" ? (
          <InventoryAwardsView awards={inventoryPresentation.awards} />
        ) : filter !== "EQUIPMENT" ? (
          <>
            <InventoryItemBrowser
              visibleItems={inventoryPresentation.visibleItems}
              observations={observations.inventory}
              filter={filter}
              search={search}
              setSearch={setSearch}
              sortOrder={sortOrder}
              setSortOrder={setSortOrder}
              selectedInstanceId={selectedItem?.instanceId ?? null}
              setSelectedInstanceId={setSelectedInstanceId}
            />
            <div className={styles.rightCol}>
              <EquippedGearSummary
                equippedSummary={inventoryPresentation.equippedSummary}
                setFilter={setFilter}
              />

              {selectedItem && (
                <ItemInspector
                  selectedItem={selectedItem}
                  observation={inventoryPresentation.selectedItemObservation}
                  selectedSequence={selectedSequence}
                  requirementResult={inventoryPresentation.selectedItemRequirements}
                  actionCapabilities={inventoryPresentation.selectedItemActions}
                  actions={actions}
                  onOpenProvenance={(item) => setProvenanceItem(item)}
                  onInspectObservation={onInspectObservation}
                />
              )}

              {provenanceItem && events && (
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
            presentation={equipmentPresentation}
            selectedSequence={selectedSequence}
            slot={slot}
            setSlot={setSlot}
            setSelectedCandidateId={setSelectedCandidateId}
            actions={actions}
            onOpenProvenance={(item) => setProvenanceItem(item)}
            onInspectObservation={onInspectObservation}
          />
        )}
      </div>
    </section>
  );
}
