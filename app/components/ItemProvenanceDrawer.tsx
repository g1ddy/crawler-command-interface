"use client";
import React from 'react';
import { CrawlerEvent, InventoryItem, ItemHistoryEntry } from '../domain/types';

interface ItemProvenanceDrawerProps {
  item: InventoryItem;
  events: CrawlerEvent[];
  onClose: () => void;
  onNavigateToSequence?: (seq: number) => void;
}

export function ItemProvenanceDrawer({
  item,
  events,
  onClose,
  onNavigateToSequence,
}: ItemProvenanceDrawerProps) {
  // Filter events related to this specific itemInstanceId
  const itemEvents: ItemHistoryEntry[] = events
    .filter((e) => {
      const payload = e as Record<string, unknown>;
      return payload.itemInstanceId === item.instanceId;
    })
    .map((e) => ({
      sequence: e.sequence,
      occurredAt: e.occurred_at,
      eventType: e.type,
      description: e.summary,
    }));

  return (
    <aside className="item-provenance-drawer panel">
      <div className="drawer-header">
        <div>
          <p className="eyebrow">ITEM PROVENANCE & LIFECYCLE</p>
          <h2>{item.name.toUpperCase()}</h2>
        </div>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="item-provenance-meta">
        <p>
          <strong>INSTANCE ID:</strong> {item.instanceId}
        </p>

        <p>
          <strong>ACQUISITION SOURCE:</strong> {item.source} (Seq #{item.acquiredAtSequence})
        </p>

        {item.durability && (
          <p>
            <strong>DURABILITY:</strong> {item.durability.current} / {item.durability.max}
          </p>
        )}
      </div>

      <div className="provenance-timeline">
        <h3>PERSONAL ITEM TIMELINE</h3>
        {itemEvents.length > 0 ? (
          <div className="timeline-list">
            {itemEvents.map((evt) => (
              <div
                key={evt.sequence}
                className="timeline-entry"
                onClick={() => onNavigateToSequence?.(evt.sequence)}
              >
                <div className="entry-header">
                  <span className="seq">SEQ #{evt.sequence}</span>
                  <span className="time">{evt.occurredAt}</span>
                  <span className="type-badge">{evt.eventType}</span>
                </div>
                <p>{evt.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-notice">No recorded historical state changes for this item instance.</p>
        )}
      </div>

      <button className="outline full-width" onClick={onClose}>
        CLOSE DRAWER
      </button>
    </aside>
  );
}
