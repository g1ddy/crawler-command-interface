"use client";
import type { CrawlerEvent, InventoryItem, ItemHistoryEntry } from "../../../../app/domain/types";

interface ItemProvenanceDrawerProps {
  item: InventoryItem;
  events: CrawlerEvent[];
  onClose: () => void;
  onNavigateToSequence?: (seq: number) => void;
}

function formatElapsedSeconds(seconds: number): string {
  const total = 4 * 3600 + seconds;
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function ItemProvenanceDrawer({ item, events, onClose, onNavigateToSequence }: ItemProvenanceDrawerProps) {
  const itemEvents: ItemHistoryEntry[] = events
    .filter((event) => {
      const payload = event as Record<string, unknown>;
      const itemPayload = payload.item as Record<string, unknown> | undefined;
      return payload.itemInstanceId === item.instanceId || itemPayload?.instanceId === item.instanceId || itemPayload?.itemInstanceId === item.instanceId || payload.instanceId === item.instanceId;
    })
    .map((event) => {
      const position = event.position as { elapsedSeconds?: number } | undefined;
      const occurredAt = typeof event.occurred_at === "string"
        ? event.occurred_at
        : position && typeof position.elapsedSeconds === "number"
        ? formatElapsedSeconds(position.elapsedSeconds)
        : "exact time not sourced";
      return { sequence: event.sequence, occurredAt, eventType: event.type, description: event.summary };
    });

  return <aside className="item-provenance-drawer panel">
    <div className="drawer-header"><div><p className="eyebrow">ITEM PROVENANCE & LIFECYCLE</p><h2>{item.name.toUpperCase()}</h2></div><button className="close-btn" onClick={onClose}>✕</button></div>
    <div className="item-provenance-meta">
      <p><strong>INSTANCE ID:</strong> {item.instanceId}</p>
      <p><strong>ITEM ID:</strong> {item.itemId}</p>
      <p><strong>CATEGORY / SLOT:</strong> {item.category} {item.slot ? `(${item.slot})` : ""}</p>
      <p><strong>ACQUISITION SOURCE:</strong> {item.source} (Seq #{item.acquiredAtSequence})</p>
      {item.durability && <p><strong>DURABILITY:</strong> {item.durability.current} / {item.durability.max}</p>}
      <p><strong>STATUS:</strong> {item.isEquipped ? "EQUIPPED" : "IN STORAGE"} {item.isLocked ? "· 🔒 LOCKED" : ""}</p>
      {item.stats && <p><strong>STATS:</strong> {Object.entries(item.stats).map(([key, value]) => `+${value} ${key}`).join(", ")}</p>}
    </div>
    <div className="provenance-timeline"><h3>PERSONAL ITEM TIMELINE</h3>{itemEvents.length > 0 ? <div className="timeline-list">{itemEvents.map((event) => <div key={event.sequence} className="timeline-entry" onClick={() => onNavigateToSequence?.(event.sequence)}><div className="entry-header"><span className="seq">SEQ #{event.sequence}</span><span className="time">{event.occurredAt}</span><span className="type-badge">{event.eventType}</span></div><p>{event.description}</p></div>)}</div> : <p className="empty-notice">No recorded historical state changes for this item instance.</p>}</div>
    <button className="outline full-width" onClick={onClose}>CLOSE DRAWER</button>
  </aside>;
}
