"use client";
import React from "react";
import type { Party } from "../../../app/domain/types";
import { Panel } from "../../shared/ui/Panel";

export function PartyView({ party }: { party?: Party }) {
  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">CRAWLER ROSTER</p>
          <h1>PARTY</h1>
        </div>
        {party && <b>{party.members.length} MEMBERS</b>}
      </header>

      {party ? (
        <Panel title={party.name}>
          <div style={{ display: "grid", gap: "8px" }}>
            {party.members.map((member) => (
              <article key={member.crawlerId} style={{ alignItems: "center", background: "#09131b", border: "1px solid #203f4d", display: "flex", fontSize: "12px", justifyContent: "space-between", padding: "14px" }}>
                <span>{member.name}</span>
                <b style={{ color: "#79e9a0", fontSize: "9px", letterSpacing: ".12em" }}>{member.role === "leader" ? "LEADER" : "MEMBER"}</b>
              </article>
            ))}
          </div>
        </Panel>
      ) : (
        <p style={{ color: "#8fa4ad", fontSize: "10px" }}>No party state is available at this replay point.</p>
      )}
    </section>
  );
}
