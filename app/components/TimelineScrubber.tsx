"use client";
import React, { useState } from 'react';
import { CrawlerEvent, EventCategory } from '../domain/types';

interface TimelineScrubberProps {
  events: CrawlerEvent[];
  selectedSequence: number;
  onSelectSequence: (seq: number) => void;
  isLive: boolean;
  onToggleLive: () => void;
}

export function TimelineScrubber({
  events,
  selectedSequence,
  onSelectSequence,
  isLive,
  onToggleLive,
}: TimelineScrubberProps) {
  const [filterCategory, setFilterCategory] = useState<EventCategory | 'all'>('all');
  const [hoveredEvent, setHoveredEvent] = useState<CrawlerEvent | null>(null);

  const minSeq = events[0]?.sequence ?? 1;
  const maxSeq = events[events.length - 1]?.sequence ?? 1;

  const currentEvent = events.find((e) => e.sequence === selectedSequence) || events[events.length - 1];

  const filteredEvents = events.filter(
    (e) => filterCategory === 'all' || e.category === filterCategory
  );

  return (
    <aside className="timeline-scrubber-panel panel">
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
            disabled={selectedSequence <= minSeq}
            onClick={() => onSelectSequence(Math.max(minSeq, selectedSequence - 1))}
            title="Previous Event"
          >
            ◄ PREV
          </button>
          <button
            disabled={selectedSequence >= maxSeq}
            onClick={() => onSelectSequence(Math.min(maxSeq, selectedSequence + 1))}
            title="Next Event"
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
          onChange={(e) => onSelectSequence(Number(e.target.value))}
          className="timeline-range-slider"
        />

        <div className="event-markers">
          {filteredEvents.map((ev) => {
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
                title={`[${ev.occurred_at}] ${ev.summary}`}
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
            <b>SEQ #{hoveredEvent.sequence} ({hoveredEvent.occurred_at})</b>
            <p>{hoveredEvent.summary}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
