"use client";
import React, { useState } from 'react';
import type {
  CrawlerEvent,
  EventCategory,
  FloorSegment,
  TimelineCountdown,
  TimelineObservation,
  TimelineSource,
  ProjectedObservationsState,
  ProjectedObservationValue,
  ProjectedItemObservation,
  ProjectedEquipmentObservation,
} from '../domain/types';
import { getFloorEndSequence } from '../domain/floors';
import { projectCountdownState, formatCountdownDuration } from '../domain/countdowns';
import { TelemetryBadge } from './TelemetryBadge';

interface TimelineScrubberProps {
  events: CrawlerEvent[];
  floors?: FloorSegment[];
  countdowns?: TimelineCountdown[];
  observations?: TimelineObservation[];
  sources?: TimelineSource[];
  projectedObservations?: ProjectedObservationsState;
  selectedFloorOrdinal: number | 'all';
  onSelectFloorOrdinal: (ordinal: number | 'all') => void;
  selectedSequence: number;
  onSelectSequence: (seq: number) => void;
  isLive: boolean;
  onToggleLive: () => void;
  onInspectObservation?: (obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
}

export function TimelineScrubber({
  events,
  floors = [],
  countdowns = [],
  observations = [],
  sources = [],
  projectedObservations,
  selectedFloorOrdinal,
  onSelectFloorOrdinal,
  selectedSequence,
  onSelectSequence,
  isLive,
  onToggleLive,
  onInspectObservation,
}: TimelineScrubberProps) {
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'all'>('all');
  const [feedMode, setFeedMode] = useState<'all' | 'events-only' | 'telemetry-only'>('all');
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);
  const [showObservationMarkers, setShowObservationMarkers] = useState<boolean>(false);
  const [hoveredEvent, setHoveredEvent] = useState<CrawlerEvent | null>(null);
  const [hoveredObservation, setHoveredObservation] = useState<TimelineObservation | null>(null);
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

  // Observations filtered by selected floor
  const floorObservations = React.useMemo(() => {
    if (selectedFloorOrdinal === 'all') return observations;
    const seqs = new Set(floorEvents.map((e) => e.sequence));
    return observations.filter((o) => seqs.has(o.sequence));
  }, [observations, floorEvents, selectedFloorOrdinal]);

  // Combined non-contiguous sequence array for sparse step navigation across events and observations
  const scopedSequences = React.useMemo(() => {
    const set = new Set<number>();
    for (const e of floorEvents) set.add(e.sequence);
    for (const o of floorObservations) set.add(o.sequence);
    return Array.from(set).sort((a, b) => a - b);
  }, [floorEvents, floorObservations]);

  const minSeq = scopedSequences[0] ?? 1;
  const maxSeq = scopedSequences[scopedSequences.length - 1] ?? 1;

  // Category-filtered events for markers display
  const markerEvents = React.useMemo(() => {
    if (feedMode === 'telemetry-only') return [];
    return floorEvents.filter(
      (e) => filterCategory === 'all' || e.category === filterCategory
    );
  }, [floorEvents, filterCategory, feedMode]);

  // Observations for track display
  const markerObservations = React.useMemo(() => {
    if (!showDiagnostics || !showObservationMarkers || feedMode === 'events-only') return [];
    return floorObservations;
  }, [floorObservations, showDiagnostics, showObservationMarkers, feedMode]);

  const currentEvent = React.useMemo(() => {
    if (events.length === 0) return undefined;
    let l = 0;
    let r = events.length - 1;
    let found = null;
    while (l <= r) {
      const m = Math.floor((l + r) / 2);
      if (events[m].sequence === selectedSequence) {
        found = events[m];
        break;
      } else if (events[m].sequence < selectedSequence) {
        l = m + 1;
      } else {
        r = m - 1;
      }
    }
    return found || events[events.length - 1];
  }, [events, selectedSequence]);

  // Helper for sparse step navigation
  const findCurrentIndex = () => {
    let l = 0;
    let r = scopedSequences.length - 1;
    let bestIdx = 0;
    while (l <= r) {
      const m = Math.floor((l + r) / 2);
      if (scopedSequences[m] <= selectedSequence) {
        bestIdx = m;
        l = m + 1;
      } else {
        r = m - 1;
      }
    }
    return bestIdx;
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
          aria-label="Floor timeline scope"
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
              className={`countdown-pill ${activeCountdown.status} ${activeCountdown.lifecycleStatus}`}
              onClick={() => setShowCountdownDetails(true)}
              style={{
                background:
                  activeCountdown.lifecycleStatus === 'scheduled'
                    ? '#382200'
                    : activeCountdown.status === 'stated'
                    ? '#0d364a'
                    : '#0c2230',
                border: `1px solid ${
                  activeCountdown.lifecycleStatus === 'scheduled'
                    ? '#ffb74d'
                    : activeCountdown.status === 'stated'
                    ? '#32c1e8'
                    : '#1c6585'
                }`,
                color: '#ffffff',
                borderRadius: '3px',
                padding: '2px 8px',
                fontSize: '11px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              title="Click to view countdown basis and reference points"
            >
              {activeCountdown.formattedTime}
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
          aria-label="Selected timeline sequence"
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
                key={`evt-${ev.sequence}`}
                style={{ left: `${pct}%` }}
                className={`marker marker-${ev.category} ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectSequence(ev.sequence)}
                onMouseEnter={() => setHoveredEvent(ev)}
                onMouseLeave={() => setHoveredEvent(null)}
                title={`[Causal Event · Floor ${ev.position?.floor ?? 1} · ${ev.occurred_at}] ${ev.summary}`}
              />
            );
          })}

          {markerObservations.map((obs) => {
            const pct = ((obs.sequence - minSeq) / (maxSeq - minSeq || 1)) * 100;
            const isSelected = obs.sequence === selectedSequence;
            return (
              <button
                key={`obs-${obs.id}`}
                style={{ left: `${pct}%` }}
                className={`marker obs-marker ${isSelected ? 'active' : ''}`}
                onClick={() => onSelectSequence(obs.sequence)}
                onMouseEnter={() => setHoveredObservation(obs)}
                onMouseLeave={() => setHoveredObservation(null)}
                title={`[Sourced Telemetry · Seq #${obs.sequence}] ${obs.kind} (${obs.interpolation || 'exact'})`}
              />
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: '14px', borderTop: '1px solid #183e4d', paddingTop: '10px' }}>
        <button
          className="outline"
          aria-expanded={showDiagnostics}
          onClick={() => setShowDiagnostics((shown) => !shown)}
          style={{ fontSize: '10px', color: '#8ca8b3', borderColor: '#294b5a' }}
        >
          {showDiagnostics ? '▾ HIDE REPLAY DIAGNOSTICS' : '▸ REPLAY DIAGNOSTICS'}
        </button>
        {!showDiagnostics && (
          <span style={{ marginLeft: '10px', fontSize: '10px', color: '#637f8c' }}>
            Event markers and telemetry inspection are available when needed.
          </span>
        )}
      </div>

      {showDiagnostics && (
      <div className="timeline-meta" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '12px', marginTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div className="filters">
            <span className="filter-label">EVENT MARKERS:</span>
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="filter-label">FEED MODE:</span>
            {(['all', 'events-only', 'telemetry-only'] as const).map((mode) => (
              <button
                key={mode}
                className={`filter-chip ${feedMode === mode ? 'active' : ''}`}
                onClick={() => setFeedMode(mode)}
              >
                {mode === 'all' ? 'ALL' : mode === 'events-only' ? 'EVENTS ONLY' : 'TELEMETRY ONLY'}
              </button>
            ))}

            <button
              className={`filter-chip ${showObservationMarkers ? 'active' : ''}`}
              style={{
                marginLeft: '6px',
                borderColor: showObservationMarkers ? '#1bd9ff' : '#2a4454',
                color: showObservationMarkers ? '#7ee5ff' : '#88a3af',
              }}
              onClick={() => setShowObservationMarkers(!showObservationMarkers)}
            >
              {showObservationMarkers ? '📡 TELEMETRY MARKERS [ON]' : '📡 TELEMETRY MARKERS [OFF]'}
            </button>
          </div>
        </div>

        {(hoveredEvent || hoveredObservation) && (
          <div className="event-card-preview" style={{ background: hoveredObservation ? '#07202b' : '#0d1f2b', borderColor: hoveredObservation ? '#1bd9ff' : '#1bd9ff' }}>
            {hoveredEvent ? (
              <>
                <span className="tag">{hoveredEvent.category.toUpperCase()}</span>
                <b>
                  ⚡ CAUSAL EVENT · FLOOR {hoveredEvent.position?.floor ?? 1} · SEQ #{hoveredEvent.sequence} ({hoveredEvent.occurred_at})
                </b>
                <p>{hoveredEvent.summary}</p>
              </>
            ) : hoveredObservation ? (
              <>
                <span className="tag" style={{ background: '#0a3a4c', color: '#8de9ff' }}>
                  📡 SOURCED TELEMETRY
                </span>
                <b>
                  OBSERVATION ({hoveredObservation.kind}) · SEQ #{hoveredObservation.sequence}
                </b>
                <p style={{ margin: '4px 0 0 0', color: '#b2e2f0' }}>
                  Interpolation: {hoveredObservation.interpolation || 'stated exact fact'} · Evidence: {hoveredObservation.evidence[0]?.sourceId || 'Sourced'}
                  {hoveredObservation.note ? ` — ${hoveredObservation.note}` : ''}
                </p>
              </>
            ) : null}
          </div>
        )}

        {/* Selected Sequence Telemetry & Evidence Inspector */}
        <SequenceInspector
          sequence={selectedSequence}
          events={events}
          observations={observations}
          sources={sources}
          projectedObservations={projectedObservations}
          feedMode={feedMode}
          onInspectObservation={onInspectObservation}
        />
      </div>
      )}

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
                <strong>COUNTDOWN DISPLAY:</strong> {activeCountdown.formattedLabel}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '11px', color: '#a4b7bf' }}>
                <div>LIFECYCLE STATUS: <strong style={{ color: '#fff' }}>{activeCountdown.lifecycleStatus.toUpperCase()}</strong></div>
                <div>READING TYPE: <strong style={{ color: '#fff' }}>{activeCountdown.status.toUpperCase()}</strong></div>
                <div>CALCULATION BASIS: <strong style={{ color: '#fff' }}>{activeCountdown.basis}</strong></div>
                <div>CONFIDENCE LEVEL: <strong style={{ color: '#fff' }}>{activeCountdown.confidence}</strong></div>
                <div>RAW REMAINING SECONDS: <strong style={{ color: '#fff' }}>{activeCountdown.remainingSeconds.toLocaleString()}s</strong></div>
                <div>ACTIVATION OFFSET: <strong style={{ color: '#fff' }}>{activeCountdown.activationOffset !== undefined ? `${activeCountdown.activationOffset}s` : 'N/A'}</strong></div>
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
                    Stated Reading: {formatCountdownDuration(ref.remainingSeconds, false, ref.activationOffset, ref.activationOffset !== undefined && ref.activationOffset < 0 ? 'scheduled' : 'active')} ({ref.remainingSeconds.toLocaleString()}s remaining{ref.activationOffset !== undefined ? `, offset: ${ref.activationOffset}s` : ''})
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

function SequenceInspector({
  sequence,
  events,
  observations,
  projectedObservations,
  feedMode,
  onInspectObservation,
}: {
  sequence: number;
  events: CrawlerEvent[];
  observations: TimelineObservation[];
  sources?: TimelineSource[];
  projectedObservations?: ProjectedObservationsState;
  feedMode: 'all' | 'events-only' | 'telemetry-only';
  onInspectObservation?: (obs: ProjectedObservationValue | ProjectedItemObservation | ProjectedEquipmentObservation) => void;
}) {
  const currentEvent = events.find((e) => e.sequence === sequence);
  const currentObservations = observations.filter((o) => o.sequence === sequence);

  const showEvents = feedMode !== 'telemetry-only';
  const showTelemetry = feedMode !== 'events-only';

  return (
    <div
      className="sequence-inspector-card"
      style={{
        background: '#06131c',
        border: '1px solid #1f4252',
        borderRadius: '4px',
        padding: '12px',
        fontSize: '11px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span className="eyebrow" style={{ margin: 0 }}>
          SEQUENCE #{sequence} STREAM & TELEMETRY DETAIL
        </span>
        <span style={{ fontSize: '10px', color: '#7fa0ac', fontFamily: 'monospace' }}>
          {currentEvent ? `Floor ${currentEvent.position?.floor ?? 1}${currentEvent.occurred_at ? ` · ${currentEvent.occurred_at}` : ''}` : `Seq #${sequence}`}
        </span>
      </div>

      {/* Replay Feed Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
        {showEvents && currentEvent && (
          <div
            className="feed-row causal-event-row"
            style={{
              background: '#0d1e29',
              borderLeft: '3px solid #ff7180',
              padding: '8px 10px',
              borderRadius: '2px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
              <strong style={{ color: '#ff8a90', fontSize: '10px', letterSpacing: '0.08em' }}>
                ⚡ CAUSAL EVENT ({currentEvent.type || 'EVENT'})
              </strong>
              <span style={{ fontSize: '9px', color: '#8ca8b3' }}>
                Category: {currentEvent.category ? currentEvent.category.toUpperCase() : 'SYSTEM'}
              </span>
            </div>
            <p style={{ margin: '2px 0 0 0', color: '#e6f3f7', fontSize: '11px' }}>
              {currentEvent.summary}
            </p>
            {currentEvent.evidence && currentEvent.evidence.length > 0 && (
              <div style={{ marginTop: '4px', fontSize: '9px', color: '#7fa0ac' }}>
                Evidence Source: <span style={{ color: '#ffb74d' }}>{currentEvent.evidence[0].sourceId}</span>
                {currentEvent.evidence[0].locator?.chapter ? ` (Chapter ${currentEvent.evidence[0].locator.chapter})` : ''}
              </div>
            )}
          </div>
        )}

        {showTelemetry && currentObservations.length > 0 && (
          currentObservations.map((obs) => (
            <div
              key={obs.id}
              className="feed-row telemetry-row"
              style={{
                background: '#07212e',
                borderLeft: '3px solid #1bd9ff',
                padding: '8px 10px',
                borderRadius: '2px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                <strong style={{ color: '#1bd9ff', fontSize: '10px', letterSpacing: '0.08em' }}>
                  📡 SOURCED TELEMETRY OBSERVATION ({obs.kind ? obs.kind.toUpperCase() : 'OBSERVATION'})
                </strong>
                <span style={{ fontSize: '9px', background: '#0a3447', color: '#7ee5ff', padding: '1px 5px', borderRadius: '3px' }}>
                  {obs.interpolation === 'linear' ? 'LINEAR ESTIMATE CAPABLE' : 'EXACT STATED FACT'}
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', color: '#d2f2fa', fontSize: '10px', fontFamily: 'monospace' }}>
                Observed payload: {formatObservationPayload(obs)}
              </p>
              {obs.evidence && obs.evidence.length > 0 && (
                <div style={{ marginTop: '4px', fontSize: '9px', color: '#88a8b5' }}>
                  Evidence Source: <span style={{ color: '#ffb74d' }}>{obs.evidence[0].sourceId}</span>
                  {obs.evidence[0].locator?.section ? ` (${obs.evidence[0].locator.section})` : obs.evidence[0].locator?.chapter ? ` (Chapter ${obs.evidence[0].locator.chapter})` : ''}
                  {obs.note ? ` — ${obs.note}` : ''}
                </div>
              )}
            </div>
          ))
        )}

        {(!currentEvent || !showEvents) && (!showTelemetry || currentObservations.length === 0) && (
          <p style={{ margin: '4px 0', fontSize: '10px', color: '#6a8592', fontStyle: 'italic' }}>
            No {feedMode === 'events-only' ? 'causal events' : feedMode === 'telemetry-only' ? 'sourced telemetry' : 'events or telemetry'} directly anchored at Sequence #{sequence}. Showing point-in-time projected state below.
          </p>
        )}
      </div>

      {/* Point-in-time Telemetry Overview */}
      {projectedObservations && (
        <div style={{ borderTop: '1px solid #183e4d', paddingTop: '8px' }}>
          <span className="eyebrow" style={{ fontSize: '8px', color: '#688996' }}>
            POINT-IN-TIME PROJECTED TELEMETRY AT SEQ #{sequence}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '6px' }}>
            {Object.entries(projectedObservations.condition).map(([k, val]) => (
              <div key={`cond-${k}`} style={{ background: '#081a26', border: '1px solid #1a3c4c', padding: '3px 7px', borderRadius: '3px', fontSize: '10px' }}>
                <span style={{ color: '#7f9ea9' }}>HP/MP.{k}: </span>
                <strong style={{ color: '#fff' }}>{val.value.toLocaleString()}</strong>
                <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
              </div>
            ))}

            {Object.entries(projectedObservations.attributes).map(([k, val]) => (
              <div key={`attr-${k}`} style={{ background: '#081a26', border: '1px solid #1a3c4c', padding: '3px 7px', borderRadius: '3px', fontSize: '10px' }}>
                <span style={{ color: '#7f9ea9' }}>Attr.{k}: </span>
                <strong style={{ color: '#fff' }}>{val.value.toLocaleString()}</strong>
                <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
              </div>
            ))}

            {Object.entries(projectedObservations.xpProgress).map(([k, val]) => (
              <div key={`xp-${k}`} style={{ background: '#081a26', border: '1px solid #1a3c4c', padding: '3px 7px', borderRadius: '3px', fontSize: '10px' }}>
                <span style={{ color: '#7f9ea9' }}>XP.{k}: </span>
                <strong style={{ color: '#fff' }}>{val.value.toLocaleString()}</strong>
                <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
              </div>
            ))}

            {Object.entries(projectedObservations.broadcast).map(([k, val]) => (
              <div key={`bc-${k}`} style={{ background: '#081a26', border: '1px solid #1a3c4c', padding: '3px 7px', borderRadius: '3px', fontSize: '10px' }}>
                <span style={{ color: '#7f9ea9' }}>Broadcast.{k}: </span>
                <strong style={{ color: '#fff' }}>{val.value.toLocaleString()}</strong>
                <TelemetryBadge observation={val} onClick={() => onInspectObservation?.(val)} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function formatObservationPayload(obs: TimelineObservation): string {
  const o = obs as unknown as Record<string, unknown>;
  if (obs.kind === 'crawler-condition') {
    return `HP: ${o.currentHealth ?? '—'}/${o.maxHealth ?? '—'}, MP: ${o.currentMana ?? '—'}/${o.maxMana ?? '—'}`;
  }
  if (obs.kind === 'crawler-attributes') {
    const attrs = o.attributes as Record<string, number> | undefined;
    return attrs ? Object.entries(attrs).map(([k, v]) => `${k}:${v}`).join(', ') : 'Attributes update';
  }
  if (obs.kind === 'xp-progress') {
    return `Level ${o.level ?? '—'}, XP: ${o.xp ?? '—'}/${o.maxXp ?? '—'}`;
  }
  if (obs.kind === 'broadcast-metrics') {
    return `Viewers: ${o.viewers ? Number(o.viewers).toLocaleString() : '—'}, Followers: ${o.followers ? Number(o.followers).toLocaleString() : '—'}`;
  }
  if (obs.kind === 'inventory-state') {
    return `Item ${o.itemInstanceId}: present=${o.present ?? true}, qty=${o.quantity ? JSON.stringify(o.quantity) : '1'}`;
  }
  if (obs.kind === 'equipment-state') {
    return `Slot ${o.slot}: ${o.itemInstanceId || 'EMPTY'}`;
  }
  if (obs.kind === 'countdown-remaining') {
    const offsetStr = o.activationOffset !== undefined ? `, offset: ${o.activationOffset}s` : '';
    return `Countdown ${o.countdownId}: ${o.remainingSeconds}s remaining${offsetStr}`;
  }
  return JSON.stringify(obs);
}
