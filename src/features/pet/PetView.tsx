"use client";
import React from "react";
import type { Pet } from "../../../app/domain/types";

export function PetView({ pets }: { pets?: Pet[] }) {
  const activePets = pets || [];

  return (
    <section className="view-content">
      <header className="title">
        <div>
          <p className="eyebrow">PET & DUNGEON FAMILIARS</p>
          <h1>PETS</h1>
        </div>
        {activePets.length > 0 && <b>{activePets.length} ACTIVE</b>}
      </header>

      {activePets.length > 0 ? (
        <div style={{ display: "grid", gap: "16px" }}>
          {activePets.map((pet) => {
            const isHostile = pet.hostility === "hostile";
            const isBonded = pet.bondState === "bonded";

            return (
              <section key={pet.petId} className="panel" aria-label={`Pet ${pet.name}`}>
                <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <h2 style={{ margin: 0 }}>{pet.name}</h2>
                      {pet.title && (
                        <span style={{ color: "#d29237", fontSize: "11px", fontWeight: "bold" }}>
                          «{pet.title}»
                        </span>
                      )}
                    </div>
                    <p style={{ color: "#8fa4ad", fontSize: "11px", margin: "2px 0 0 0" }}>
                      Species: {pet.species}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <span
                      style={{
                        background: isBonded ? "rgba(210, 146, 55, 0.2)" : "rgba(255, 255, 255, 0.1)",
                        border: `1px solid ${isBonded ? "#d29237" : "#555"}`,
                        color: isBonded ? "#d29237" : "#aaa",
                        fontSize: "9px",
                        fontWeight: "bold",
                        letterSpacing: ".1em",
                        padding: "2px 6px",
                      }}
                    >
                      {isBonded ? "BONDED" : "UNBONDED"}
                    </span>
                    <span
                      style={{
                        background: isHostile ? "rgba(235, 87, 87, 0.2)" : "rgba(121, 233, 160, 0.15)",
                        border: `1px solid ${isHostile ? "#eb5757" : "#79e9a0"}`,
                        color: isHostile ? "#eb5757" : "#79e9a0",
                        fontSize: "9px",
                        fontWeight: "bold",
                        letterSpacing: ".1em",
                        padding: "2px 6px",
                      }}
                    >
                      {isHostile ? "HOSTILE" : "NON-HOSTILE"}
                    </span>
                  </div>
                </header>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "8px",
                    background: "#09131b",
                    border: "1px solid #203f4d",
                    padding: "12px",
                    fontSize: "11px",
                  }}
                >
                  <div>
                    <span style={{ color: "#8fa4ad", display: "block", fontSize: "9px" }}>ORIGIN</span>
                    <b style={{ color: "#e2e8f0" }}>{pet.origin.toUpperCase()}</b>
                  </div>
                  <div>
                    <span style={{ color: "#8fa4ad", display: "block", fontSize: "9px" }}>CLASSIFICATION</span>
                    <b style={{ color: "#e2e8f0" }}>{pet.classification.toUpperCase()}</b>
                  </div>
                  <div>
                    <span style={{ color: "#8fa4ad", display: "block", fontSize: "9px" }}>BOND HOLDER</span>
                    <b style={{ color: pet.bondHolderCrawlerId ? "#79e9a0" : "#8fa4ad" }}>
                      {pet.bondHolderCrawlerId ? pet.bondHolderCrawlerId : "NONE (UNBONDED)"}
                    </b>
                  </div>
                  <div>
                    <span style={{ color: "#8fa4ad", display: "block", fontSize: "9px" }}>LEVEL</span>
                    <b style={{ color: "#8fa4ad" }}>{pet.level !== undefined ? `Level ${pet.level}` : "NOT SOURCED (BOOK 1)"}</b>
                  </div>
                  <div>
                    <span style={{ color: "#8fa4ad", display: "block", fontSize: "9px" }}>DEPLOYMENT</span>
                    <b style={{ color: "#e2e8f0" }}>{(pet.deployment || "ACTIVE").toUpperCase()}</b>
                  </div>
                  <div>
                    <span style={{ color: "#8fa4ad", display: "block", fontSize: "9px" }}>CONDITION</span>
                    <b style={{ color: "#8fa4ad" }}>{pet.condition?.status || "NOT SOURCED"}</b>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <p style={{ color: "#8fa4ad", fontSize: "10px" }}>No pet state is available at this replay sequence.</p>
      )}
    </section>
  );
}
