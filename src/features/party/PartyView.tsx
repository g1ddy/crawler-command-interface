"use client";
import React from "react";
import { Panel } from "../../shared/ui/Panel.tsx";
import type { DerivedPartyPresentation } from "./public.ts";
import styles from "./PartyView.module.css";

export function PartyView({ presentation }: { presentation: DerivedPartyPresentation }) {
  return <section className={styles.viewContent}>
    <header className={styles.title}><div><p className={styles.eyebrow}>CRAWLER ROSTER</p><h1>PARTY</h1></div>{presentation.hasParty&&<b className={styles.memberBadge}>{presentation.memberBadgeLabel}</b>}</header>
    {presentation.hasParty?<Panel title={presentation.partyName??"PARTY"} ariaLabel={(presentation.partyName??"Party")+" roster"}><div className={styles.roster}>{presentation.members.map(member=><article key={member.crawlerId} className={styles.member}><span className={styles.memberName}>{member.name}</span><b className={styles.memberRole}>{member.roleLabel}</b></article>)}</div></Panel>:<p className={styles.unavailableText}>No party state is available at this replay point.</p>}
  </section>;
}