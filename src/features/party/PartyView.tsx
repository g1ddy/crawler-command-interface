"use client";
import React from "react";
import type { Party } from "../../../app/domain/types";

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
        <section className="panel" aria-label={`${party.name} roster`}>
          <h2>{party.name}</h2>
          <div style={{ display: "grid", gap: "8px" }}>
            {party.members.map((member) => (
              <article key={member.crawlerId} style={{ alignItems: "center", background: "#09131b", border: "1px solid #203f4d", display: "flex", fontSize: "12px", justifyContent: "space-between", padding: "14px" }}>
                <span>{member.name}</span>
                <b style={{ color: "#79e9a0", fontSize: "9px", letterSpacing: ".12em" }}>{member.role === "leader" ? "LEADER" : "MEMBER"}</b>
              </article>
            ))}
          </div>
          <p style={{ color: "#8fa4ad", fontSize: "10px", lineHeight: 1.5, margin: "16px 0 0" }}>Only source-backed crawler membership and party role are shown at this replay point.</p>
        </section>
      ) : (
        <p style={{ color: "#8fa4ad", fontSize: "10px" }}>No party state is available at this replay point.</p>
      )}
    </section>
  );
}
