"use client";
import React, { useState } from 'react';
import type { CrawlerEvent, EventCategory, FloorSegment } from '../domain/types';

interface TimelineScrubberProps {
  events: CrawlerEvent[];
  floors?: FloorSegment[];
  selectedFloorOrdinal: number | 'all';
  onSelectFloorOrdinal: (ordinal: number | 'all') => void;
  selectedSequence: number;
  onSelectSequence: (seq: number) => void;
  isLive: boolean;
  onToggleLive: () => void;
}

export function TimelineScrubber({
  events,
  floors = [],
  selectedFloorOrdinal,
  onSelectFloorOrdinal,
  selectedSequence,
  onSelectSequence,
  isLive,
  onToggleLive,
}: TimelineScrubberProps) {
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'all'>('all');
  const [hoveredEvent, setHoveredEvent] = useState<CrawlerEvent | null>(null);

  // Derive floor list if floors prop not explicitly passed
  const availableFloors = React.useMemo(() => {
    if (floors.length > 0) return floors;
    const map = new Map<number, FloorSegment>();
    for (const e of events) {
      const fNum = e.position?.floor ?? 6;
      if (!map.has(fNum)) {
        map.set(fNum, {
          id: `floor-${fNum}`,
          ordinal: fNum,
          title: `Floor ${fNum}`,
          startSequence: e.sequence,
          endSequence: e.sequence,
        });
      } else {
        const seg = map.get(fNum)!;
        seg.endSequence = e.sequence;
      }
    }
    return Array.from(map.values()).sort((a, b) => a.ordinal - b.ordinal);
  }, [floors, events]);

  // Events filtered by selected floor
  const floorEvents = React.useMemo(() => {
    if (selectedFloorOrdinal === 'all') return events;
    return events.filter((e) => e.position?.floor === selectedFloorOrdinal);
  }, [events, selectedFloorOrdinal]);

  // Non-contiguous sequence array for sparse step navigation
  const scopedSequences = React.useMemo(() => {
    return floorEvents.map((e) => e.sequence).sort((a, b) => a - b);
  }, [floorEvents]);

  const minSeq = scopedSequences[0] ?? 1;
  const maxSeq = scopedSequences[scopedSequences.length - 1] ?? 1;

  // Category-filtered events for markers display
  const markerEvents = React.useMemo(() => {
    return floorEvents.filter(
      (e) => filterCategory === 'all' || e.category === filterCategory
    );
  }, [floorEvents, filterCategory]);

  const currentEvent =
    events.find((e) => e.sequence === selectedSequence) || events[events.length - 1];

  // Helper for sparse step navigation
  const findCurrentIndex = () => {
    const idx = scopedSequences.indexOf(selectedSequence);
    if (idx !== -1) return idx;
    // Find closest sequence <= selectedSequence
    for (let i = scopedSequences.length - 1; i >= 0; i--) {
      if (scopedSequences[i] <= selectedSequence) return i;
    }
    return 0;
  };

  const handlePrevStep = () => {
    const idx = findCurrentIndex();
    if (idx > 0) {
      onSelectSequence(scopedSequences[idx - 1]);
    }
  };

  const handleNextStep = () => {
    const idx = findCurrentIndex();
    if (idx < scopedSequences.length - 1) {
      onSelectSequence(scopedSequences[idx + 1]);
    }
  };

  const currentFloorIdx = availableFloors.findIndex((f) => f.ordinal === selectedFloorOrdinal);

  return (
    <aside className="timeline-scrubber-panel panel">
      {/* Floor Navigator Bar */}
      <div
        className="floor-navigator-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingBottom: '10px',
          marginBottom: '10px',
          borderBottom: '1px solid #1f3e4d',
        }}
      >
        <div style={{ fontSize: '11px', color: '#ffb74d', fontWeight: 'bold' }}>
          FLOOR NAVIGATOR:
        </div>
        <button
          className="mode-btn"
          disabled={selectedFloorOrdinal === 'all' || currentFloorIdx <= 0}
          onClick={() => {
            if (currentFloorIdx > 0) {
              const prevFloor = availableFloors[currentFloorIdx - 1];
              onSelectFloorOrdinal(prevFloor.ordinal);
            }
          }}
          title="Previous Floor Context"
        >
          ◄ PREV FLOOR
        </button>
        <select
          value={selectedFloorOrdinal}
          onChange={(e) => {
            const val = e.target.value === 'all' ? 'all' : Number(e.target.value);
            onSelectFloorOrdinal(val);
          }}
          style={{
            background: '#06131c',
            color: '#9be2f3',
            border: '1px solid #1f4252',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '11px',
            fontFamily: 'monospace',
          }}
        >
          <option value="all">★ All Floors (Whole Story Mode)</option>
          {availableFloors.map((f) => (
            <option key={f.id} value={f.ordinal}>
              Floor {f.ordinal}: {f.title}
            </option>
          ))}
        </select>
        <button
          className="mode-btn"
          disabled={selectedFloorOrdinal === 'all' || currentFloorIdx >= availableFloors.length - 1}
          onClick={() => {
            if (currentFloorIdx < availableFloors.length - 1) {
              const nextFloor = availableFloors[currentFloorIdx + 1];
              onSelectFloorOrdinal(nextFloor.ordinal);
            }
          }}
          title="Next Floor Context"
        >
          NEXT FLOOR ►
        </button>
      </div>

      <div className="timeline-header">
        <div className="live-controls">
          <button
            className={`mode-btn ${isLive ? 'live-on' : ''}`}
            onClick={() => {
              if (!isLive) onToggleLive();
            }}
          >
            ● LIVE
          </button>
          <button
            className={`mode-btn ${!isLive ? 'replay-on' : ''}`}
            onClick={() => {
              if (isLive) onToggleLive();
            }}
          >
            ↺ REPLAY MODE
          </button>
        </div>

        <div className="time-display">
          <span className="eyebrow">SELECTED TIMELINE SEQUENCE</span>
          <h2>
            SEQ #{selectedSequence} <small>({currentEvent?.occurred_at || '04:00:00'})</small>
          </h2>
        </div>

        <div className="step-controls">
          <button
            disabled={findCurrentIndex() <= 0}
            onClick={handlePrevStep}
            title="Previous Event in Selected Scope"
          >
            ◄ PREV
          </button>
          <button
            disabled={findCurrentIndex() >= scopedSequences.length - 1}
            onClick={handleNextStep}
            title="Next Event in Selected Scope"
          >
            NEXT ►
          </button>
          {!isLive && (
            <button className="return-live-btn" onClick={onToggleLive}>
              RETURN TO LIVE ⚡
            </button>
          )}
        </div>
      </div>

      <div className="slider-wrapper">
        <input
          type="range"
          min={minSeq}
          max={maxSeq}
          value={selectedSequence}
          onChange={(e) => {
            const targetVal = Number(e.target.value);
            // Snap targetVal to closest sequence in scopedSequences
            let closest = scopedSequences[0];
            let minDiff = Math.abs(targetVal - closest);
            for (const s of scopedSequences) {
              const diff = Math.abs(targetVal - s);
              if (diff < minDiff) {
                minDiff = diff;
                closest = s;
              }
            }
            onSelectSequence(closest);
          }}
          className="timeline-range-slider"
        />

        <div className="event-markers">
          {markerEvents.map((ev) => {
            const pct = ((ev.sequence - minSeq) / (maxSeq - minSeq || 1)) * 100;
            const isSelected = ev.sequence === selectedSequence;
            return (
              <button
                key={ev.sequence}
                style={{ left: `${pct}%` }}
                className={`marker marker-${ev.category} ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectSequence(ev.sequence)}
                onMouseEnter={() => setHoveredEvent(ev)}
                onMouseLeave={() => setHoveredEvent(null)}
                title={`[Floor ${ev.position?.floor ?? 6} · ${ev.occurred_at}] ${ev.summary}`}
              />
            );
          })}
        </div>
      </div>

      <div className="timeline-meta">
        <div className="filters">
          <span className="filter-label">FILTER MARKERS:</span>
          {(['all', 'loot', 'combat', 'skills', 'quest', 'levelup', 'system'] as const).map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${filterCategory === cat ? 'active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>

        {hoveredEvent && (
          <div className="event-card-preview">
            <span className="tag">{hoveredEvent.category.toUpperCase()}</span>
            <b>
              FLOOR {hoveredEvent.position?.floor ?? 6} · SEQ #{hoveredEvent.sequence} ({hoveredEvent.occurred_at})
            </b>
            <p>{hoveredEvent.summary}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
