"use client";
import React, { useState } from 'react';
import type { CrawlerEvent, EventCategory, FloorSegment, TimelineCountdown } from '../domain/types';
import { getFloorEndSequence } from '../domain/floors';
import { projectCountdownState, formatCountdownDuration } from '../domain/countdowns';

interface TimelineScrubberProps {
  events: CrawlerEvent[];
  floors?: FloorSegment[];
  countdowns?: TimelineCountdown[];
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
  countdowns = [],
  selectedFloorOrdinal,
  onSelectFloorOrdinal,
  selectedSequence,
  onSelectSequence,
  isLive,
  onToggleLive,
}: TimelineScrubberProps) {
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'all'>('all');
  const [hoveredEvent, setHoveredEvent] = useState<CrawlerEvent | null>(null);
  const [showCountdownDetails, setShowCountdownDetails] = useState<boolean>(false);

  // Derive floor list and ensure derived endSequence is applied to every floor segment
  const availableFloors = React.useMemo(() => {
    let baseFloors: FloorSegment[] = [];
    if (floors.length > 0) {
      baseFloors = floors;
    } else {
      const map = new Map<number, FloorSegment>();
      for (const e of events) {
        const fNum = e.position?.floor ?? 1;
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
          seg.endSequence = Math.max(seg.endSequence, e.sequence);
        }
      }
      baseFloors = Array.from(map.values()).sort((a, b) => a.ordinal - b.ordinal);
    }

    return baseFloors.map((f) => ({
      ...f,
      endSequence: getFloorEndSequence(events, f.ordinal, f.endSequence),
    }));
  }, [floors, events]);

  // Compute active countdown projection for the selected sequence and floor
  const activeCountdown = React.useMemo(() => {
    return projectCountdownState({ events, countdowns }, selectedSequence, selectedFloorOrdinal);
  }, [events, countdowns, selectedSequence, selectedFloorOrdinal]);

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
          flexWrap: 'wrap',
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
              onSelectSequence(prevFloor.endSequence);
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
            if (val !== 'all') {
              const selectedSeg = availableFloors.find((f) => f.ordinal === val);
              if (selectedSeg) {
                onSelectSequence(selectedSeg.endSequence);
              }
            }
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
              onSelectSequence(nextFloor.endSequence);
            }
          }}
          title="Next Floor Context"
        >
          NEXT FLOOR ►
        </button>

        {activeCountdown && (
          <div
            className="countdown-hud-readout"
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#081720',
              border: '1px solid #1a475c',
              borderRadius: '4px',
              padding: '4px 8px',
              fontSize: '11px',
              fontFamily: 'monospace',
            }}
          >
            <span style={{ color: '#ffb74d', fontWeight: 'bold' }}>⏱ COUNTDOWN:</span>
            <button
              className={`countdown-pill ${activeCountdown.status}`}
              onClick={() => setShowCountdownDetails(true)}
              style={{
                background: activeCountdown.status === 'stated' ? '#0d364a' : '#0c2230',
                border: `1px solid ${activeCountdown.status === 'stated' ? '#32c1e8' : '#1c6585'}`,
                color: '#ffffff',
                borderRadius: '3px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              title="Click to view countdown basis and reference points"
            >
              {activeCountdown.formattedLabel} ℹ️
            </button>
          </div>
        )}
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

      {showCountdownDetails && activeCountdown && (
        <div className="modal-backdrop" onClick={() => setShowCountdownDetails(false)}>
          <div className="modal-content panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">COUNTDOWN ESTIMATE & PROVENANCE</p>
                <h2>{activeCountdown.title.toUpperCase()} (FLOOR {activeCountdown.floor})</h2>
              </div>
              <button className="close-btn" onClick={() => setShowCountdownDetails(false)}>✕</button>
            </div>

            <div style={{ background: '#06131c', padding: '12px', border: '1px solid #1f4252', borderRadius: '4px', marginBottom: '12px' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '14px', color: '#ffb74d' }}>
                <strong>REMAINING TIME:</strong> {activeCountdown.formattedLabel}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#a4b7bf' }}>
                <div>STATUS: <strong style={{ color: '#fff' }}>{activeCountdown.status.toUpperCase()}</strong></div>
                <div>CALCULATION BASIS: <strong style={{ color: '#fff' }}>{activeCountdown.basis}</strong></div>
                <div>CONFIDENCE LEVEL: <strong style={{ color: '#fff' }}>{activeCountdown.confidence}</strong></div>
                <div>RAW REMAINING SECONDS: <strong style={{ color: '#fff' }}>{activeCountdown.remainingSeconds.toLocaleString()}s</strong></div>
              </div>
              {activeCountdown.note && (
                <p style={{ margin: '8px 0 0 0', fontSize: '10px', color: '#88a3b0', fontStyle: 'italic' }}>
                  Note: {activeCountdown.note}
                </p>
              )}
            </div>

            <p className="eyebrow" style={{ marginTop: '10px' }}>COUNTDOWN REFERENCE POINTS ({activeCountdown.referencePoints.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {activeCountdown.referencePoints.map((ref, idx) => (
                <div
                  key={ref.sequence}
                  style={{
                    background: '#091924',
                    border: '1px solid #1d3e4e',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    fontSize: '11px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>
                      Reference #{idx + 1}: Sequence #{ref.sequence}
                    </strong>
                    <button
                      style={{
                        background: '#0f3142',
                        border: '1px solid #1f5b7a',
                        color: '#8be5ff',
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '3px',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        onSelectSequence(ref.sequence);
                        setShowCountdownDetails(false);
                      }}
                    >
                      JUMP TO SEQ #{ref.sequence} ➔
                    </button>
                  </div>
                  <p style={{ margin: '4px 0', color: '#68d4f0' }}>
                    Stated Remaining Time: {formatCountdownDuration(ref.remainingSeconds, false)} ({ref.remainingSeconds.toLocaleString()}s)
                  </p>
                  {ref.note && <p style={{ margin: '2px 0', fontSize: '10px', color: '#9db8c7' }}>{ref.note}</p>}
                  {ref.evidence && ref.evidence.length > 0 && (
                    <p style={{ margin: '2px 0', fontSize: '9px', color: '#6e8a99' }}>
                      Evidence: Source {ref.evidence[0].sourceId} {ref.evidence[0].locator?.chapter ? `(Chapter ${ref.evidence[0].locator.chapter})` : ''} [{ref.evidence[0].confidence || 'confirmed'}]
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="modal-footer" style={{ marginTop: '12px' }}>
              <button className="outline" onClick={() => setShowCountdownDetails(false)}>CLOSE</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
