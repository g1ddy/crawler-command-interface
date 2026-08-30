"use client";
import React, { useState, useMemo } from "react";
import type { Quest } from "../../../app/domain/types";
import { QuestCard } from "./QuestCard";

interface QuestsViewProps {
  quests: Quest[];
}

type QuestFilter = "ACTIVE" | "COMPLETED" | "FAILED" | "UNKNOWN";
type QuestWithStatus = Quest & { status: NonNullable<Quest["status"]> };

function hasStatus(status: NonNullable<Quest["status"]>) {
  return (quest: Quest): quest is QuestWithStatus => quest.status === status;
}

export function QuestsView({ quests }: QuestsViewProps) {
  const [filter, setFilter] = useState<QuestFilter>("ACTIVE");

  const activeQuests = useMemo(
    () => quests.filter(hasStatus("active")),
    [quests]
  );
  const completedQuests = useMemo(
    () => quests.filter(hasStatus("completed")),
    [quests]
  );
  const failedQuests = useMemo(
    () => quests.filter(hasStatus("failed")),
    [quests]
  );
  const unknownQuests = useMemo(
    () => quests.filter((quest) => quest.status === undefined),
    [quests]
  );

  const hasUnknownQuests = unknownQuests.length > 0;
  // Replay can move past the point where a statusless quest gains a known
  // status. Keep the visible filter valid without synchronously setting state
  // from an effect; if UNKNOWN is unavailable, present ACTIVE as the fallback.
  const effectiveFilter: QuestFilter = filter === "UNKNOWN" && !hasUnknownQuests
    ? "ACTIVE"
    : filter;

  const displayedQuests =
    effectiveFilter === "ACTIVE"
      ? activeQuests
      : effectiveFilter === "COMPLETED"
      ? completedQuests
      : effectiveFilter === "FAILED"
      ? failedQuests
      : unknownQuests;

  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">OBJECTIVES & MISSIONS</p>
          <h1>QUESTS</h1>
        </div>
        <div className="subnav" aria-label="Quest status filters">
          <button
            className={effectiveFilter === "ACTIVE" ? "on" : ""}
            onClick={() => setFilter("ACTIVE")}
          >
            ACTIVE ({activeQuests.length})
          </button>
          <button
            className={effectiveFilter === "COMPLETED" ? "on" : ""}
            onClick={() => setFilter("COMPLETED")}
          >
            COMPLETED ({completedQuests.length})
          </button>
          <button
            className={effectiveFilter === "FAILED" ? "on" : ""}
            onClick={() => setFilter("FAILED")}
          >
            FAILED ({failedQuests.length})
          </button>
          {hasUnknownQuests && (
            <button
              className={effectiveFilter === "UNKNOWN" ? "on" : ""}
              onClick={() => setFilter("UNKNOWN")}
            >
              UNKNOWN ({unknownQuests.length})
            </button>
          )}
        </div>
      </header>

      <div className="quests-container" style={{ display: "grid", gap: "12px", marginTop: "16px" }}>
        {displayedQuests.length > 0 ? (
          displayedQuests.map((q) => (
            <QuestCard
              key={q.questId}
              title={q.title}
              urgency={q.urgency}
              goals={q.goals}
              rewards={q.rewards}
              status={q.status}
            />
          ))
        ) : (
          <p style={{ fontSize: "11px", color: "#8fa1aa", padding: "12px 0" }}>
            {effectiveFilter === "ACTIVE"
              ? "No active quests."
              : effectiveFilter === "COMPLETED"
              ? "No completed quests."
              : effectiveFilter === "FAILED"
              ? "No failed quests."
              : "No quests with unknown status."}
          </p>
        )}
      </div>
    </section>
  );
}
