"use client";

import React from "react";
import type { Party } from "../../../app/domain/types.ts";
import { Panel } from "../../shared/ui/Panel.tsx";
import { derivePartyPresentation, type DerivedPartyPresentation } from "./party-presentation.ts";
import styles from "./PartyView.module.css";

export function PartyView({
  presentation,
  party,
}: {
  presentation?: DerivedPartyPresentation;
  party?: Party;
}) {
  const partyPresentation = presentation ?? derivePartyPresentation({ party });

  return (
    <section className={styles.viewContent}>
      <header className={styles.title}>
        <div>
          <p className={styles.eyebrow}>CRAWLER ROSTER</p>
          <h1>PARTY</h1>
        </div>
        {partyPresentation.hasParty && (
          <b className={styles.memberBadge}>{partyPresentation.badgeLabel}</b>
        )}
      </header>

      {partyPresentation.hasParty && partyPresentation.name ? (
        <Panel title={partyPresentation.name} ariaLabel={`${partyPresentation.name} roster`}>
          <div className={styles.rosterList}>
            {partyPresentation.members.map((member) => (
              <article key={member.crawlerId} className={styles.memberCard}>
                <span>{member.name}</span>
                <b
                  className={`${styles.roleTag} ${
                    member.isLeader ? styles.leaderRole : styles.memberRole
                  }`}
                >
                  {member.roleLabel}
                </b>
              </article>
            ))}
          </div>
        </Panel>
      ) : (
        <p className={styles.unavailableText}>
          No party state is available at this replay point.
        </p>
      )}
    </section>
  );
}
