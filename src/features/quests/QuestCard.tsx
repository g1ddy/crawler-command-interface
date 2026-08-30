import React from "react";
import type { Quest } from "../../../app/domain/types";

interface QuestCardProps {
  title: string;
  urgency: string;
  goals: string[];
  rewards: string;
  status?: Quest["status"];
}

export function QuestCard({
  title,
  urgency,
  goals,
  rewards,
  status = "active",
}: QuestCardProps) {
  const currentStatus = status || "active";
  return (
    <article className={`quest ${currentStatus}`}>
      <header>
        <h2>{title}</h2>
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <i
            style={{
              fontStyle: "normal",
              fontSize: "9px",
              padding: "5px",
              background:
                currentStatus === "completed" ? "#133822" : currentStatus === "failed" ? "#4a1215" : "#103242",
              color:
                currentStatus === "completed" ? "#6bf1b1" : currentStatus === "failed" ? "#ff8a90" : "#86cbff",
              border: `1px solid ${
                currentStatus === "completed" ? "#288e58" : currentStatus === "failed" ? "#9e2d35" : "#1f5873"
              }`,
            }}
          >
            {currentStatus.toUpperCase()}
          </i>
          <i>{urgency}</i>
        </div>
      </header>
      <p>Dungeon conditions are unstable. Complete this before failure becomes permanent.</p>
      <ul>
        {goals.map((x) => (
          <li key={x}>{x}</li>
        ))}
      </ul>
      <footer>
        REWARDS <b>{rewards}</b>
      </footer>
    </article>
  );
}
