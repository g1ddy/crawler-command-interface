# Third Floor Claim Ledger — Carl's Doomsday Scenario

This document records Floor 3 research, provenance, and modeling decisions for *Dungeon Crawler Carl, Book 2: Carl's Doomsday Scenario*.

Coverage Statement: Curated critical Floor 3 chronology and state needed to support replay-aware domain research. Routine combat, drops, temporary state, and unsourced intermediate events are intentionally omitted.

## Structured Research & Chronology Ledger

| Claim | Source Tier | Locator | Confidence | Modeling Category | Promotion |
| --- | --- | --- | --- | --- | --- |
| Transition to Floor 3; race/class selection terminal reached in entry space | Corroborating | Book 2, Ch. 1; Third Floor wiki | Corroborated | Narrative Event | Promoted (`evt-f3-entered`, `evt-f3-race-class-selected`) |
| Floor 3 is the Over City, with engineered NPC/civilian narrative, Scolopendra lore, and the Volcano storyline | Corroborating | Book 2, Ch. 3; Third Floor wiki | Corroborated | Narrative Event | Promoted (`evt-f3-over-city-entered`) |
| Floor 3 has an eight-day collapse timer and a day/night urban environment | Corroborating | Third Floor / Book 2 research | Corroborated | Floor Rule | Conceptual countdown declared (`countdown-floor-3-collapse`); no runtime seconds invented |
| Party departs the starter village toward the medium settlement ruins | Corroborating | Book 2, Ch. 3; Book 2 summaries | Corroborated | Location transition | Promoted (`evt-f3-starter-village-departed`) |
| The Show Must Go On quest triggered by Former Circus Lemur ambush | Primary | Book 2, Ch. 4 | Confirmed | Quest Event | Promoted (`evt-f3-show-must-go-on-triggered`) |
| Terror the Clown defeated and Big Top Ticket acquired | Primary | Book 2, Ch. 4 | Confirmed | Encounter / Item | Promoted (`evt-f3-big-top-ticket-acquired`) |
| Party reaches Belly-Rubbed Pug safe room | Primary | Book 2, Ch. 5 | Confirmed | Location transition | Promoted (`evt-f3-belly-rubbed-pug-reached`) |
| The Show Must Go On completes; circus disappears exposing hidden stairwell | Primary | Book 2, Ch. 11 | Confirmed | Quest Event | Promoted (`evt-f3-show-must-go-on-completed`) |
| Party reaches Medium Skyfowl Settlement | Corroborating | Book 2, Ch. 14; Book 2 summaries | Corroborated | Location transition | Promoted (`evt-f3-medium-skyfowl-settlement-reached`) |
| Party reaches Desperado Club along the Silk Road | Primary | Book 2, Ch. 16 | Confirmed | Location transition | Promoted (`evt-f3-desperado-club-reached`) |
| Sex Workers Who Fell from the Heavens triggered by GumGum's corpse discovery | Primary | Book 2, Ch. 17 | Confirmed | Quest Event | Promoted (`evt-f3-sex-workers-quest-triggered`) |
| Katia Grim joins the party | Primary | Book 2, Ch. 21 | Confirmed | Party State | Promoted (`evt-f3-katia-joined`) |
| Carl detonates explosives in Miss Quill's office; Magistrate's office is destroyed | Primary | Book 2, Ch. 21–22 | Confirmed | Encounter / Achievement | Promoted (`evt-f3-magistrate-office-destroyed`, `evt-f3-achievement-ultimate-extreme-power`) |
| Remex revealed as Soul Leech Capacitor; Final War destabilizes and Fools Who Broke the Glass begins | Primary | Book 2, Ch. 24 | Confirmed | Quest Event | Promoted (`evt-f3-fools-who-broke-the-glass`) |
| Carl encapsulates active Soul Crystal in Sheol Glass Reaper Case, creating Carl's Doomsday Scenario | Primary | Book 2, Ch. 25 | Confirmed | Item Creation | Promoted (`evt-f3-doomsday-scenario-created`) |
| Party escapes via Red Line, Car 20 stairwell to Floor 4 | Corroborating | Book 2, Ch. 25; Third Floor wiki | Corroborated | Floor Boundary | Promoted (`evt-f3-floor-4-transition`) |
| Epilogue interview with Odette occurs ~2.5 days after descent | Corroborating | Book 2, Ch. 26; Book 2 summaries | Corroborated | Narrative Event | Promoted (`evt-f3-odette-epilogue`) |
| Bandit Achievement awarded for unusual Soul Crystal rescue outcome | Primary | Book 2, Ch. 26 | Confirmed | Achievement Event | Promoted (`evt-f3-achievement-bandit`) |

## Crawler Progression & Party State Research (Handoff for #182)

| Claim | Locator | Domain | Promotion |
| --- | --- | --- | --- |
| Donut selects Cat race and Former Child Actor class | Book 2, Ch. 1 | Crawler State | Baseline choice event (`evt-f3-race-class-selected`) |
| Manager Benefit activates and binds Mordecai to the party as manager | Book 2, Ch. 1 | Social / Party | Ledger-only (owned by #182/#185) |
| Carl selects Primal race and Compensated Anarchist class | Book 2, Ch. 1 | Crawler State | Baseline choice event (`evt-f3-race-class-selected`) |
| Katia Grim joins the party | Book 2, Ch. 21 | Party state | Baseline party event (`evt-f3-katia-joined`) |
| Final recorded levels: Carl 27, Donut 26, Katia 21 | Book 2, Ch. 26 | Crawler State | Ledger-only (owned by #182) |

## Pet / Mongo Research (Handoff for #181)

| Claim | Locator | Domain | Promotion |
| --- | --- | --- | --- |
| Mongo reaches Level 3 and grows substantially after entering Floor 3 | Book 2, Ch. 5 | Pet progression | Ledger-only (owned by #181) |
| Donut receives magical tracking collar for Mongo from Gold Pet Box | Book 2, Ch. 5 | Pet equipment / HUD | Ledger-only (owned by #181/#183) |
| Donut learns Clockwork Triplicate, producing two clockwork Mongo copies | Book 2, Ch. 5 | Pet / Spell capability | Ledger-only (owned by #181/#184) |
| Mongo severely wounded defending unconscious Donut from Level 8 Urchins | Book 2, Ch. 12 | Pet condition / combat | Ledger-only (owned by #181) |
| Donut's Cockroach Skill preserves party through night; Water Lily dissipates | Book 2, Ch. 12 | Condition / Skill | Ledger-only (owned by #181/#184) |
| Mongo receives fang caps | Book 2, Ch. 13 | Pet equipment | Ledger-only (owned by #181/#183) |
| Mongo participates in 201st Security Group conflict / Ricky Joe encounter | Book 2, Ch. 20 | Pet deployment / combat | Ledger-only (owned by #181) |

## Skills / Magic / Quests Research (Handoff for #184)

| Claim | Locator | Domain | Promotion |
| --- | --- | --- | --- |
| Tsarina Signet uses Water Lily on Donut to force Carl's cooperation | Book 2, Ch. 8 | Spell / Quest | Ledger-only (owned by #184) |
| Carl defeats Heather the Bear; parasite interaction involving Fireball/Custard | Book 2, Ch. 9 | Spell / Encounter | Ledger-only (owned by #184) |
| Signet uses Heather's blood to summon Ink and Blood elementals | Book 2, Ch. 9 | Spell / Encounter | Ledger-only (owned by #184) |
| Carl uses Wisp Armor to resist mind control | Book 2, Ch. 11 | Spell | Ledger-only (owned by #184) |
| Carl uses max-level fireball scratchcard to eliminate Krasue nest | Book 2, Ch. 22 | Spell / Encounter | Ledger-only (owned by #184) |

## Inventory / Equipment / Loot Research (Handoff for #183)

| Claim | Locator | Domain | Promotion |
| --- | --- | --- | --- |
| Carl gains Cesta Punta, cactus, and Louis L'Amour books from hobby potion | Book 2, Ch. 5 | Inventory / Skill | Ledger-only (owned by #183) |
| Donut receives anklet from circus exploration | Book 2, Ch. 6 | Inventory | Ledger-only (owned by #183) |
| Donut gains cat tree and scented candle | Book 2, Ch. 5 | Inventory | Ledger-only (owned by #183) |
| Mordecai trades moonshine to Quint for Pharmaceutical Starter Kit & Blitz Sticks | Book 2, Ch. 15 | Inventory / Commerce | Ledger-only (owned by #183) |
| Party purchases Hoblobbers and Dynamite from Pustule on Silk Road | Book 2, Ch. 16 | Inventory / Commerce | Ledger-only (owned by #183) |
| Fan Boxes unlock; Carl receives xistera, Donut receives Bea/Brad photograph | Book 2, Ch. 17 | Loot / Audience | Ledger-only (owned by #183) |
| Carl loots Kimaris figure | Book 2, Ch. 23 | Inventory | Ledger-only (owned by #183) |
| Enchanted Crown of the Sepsis Whore destroyed by third precursor blast | Book 2, Ch. 25 | Equipment destruction | Ledger-only (owned by #183) |
| Borant vetoes distribution of 83 Celestial-quality boxes | Book 2, Ch. 26 | Award state | Ledger-only (owned by #183/#186) |

## Social / Broadcast / Achievement Research (Handoff for #185 / #186)

| Claim | Locator | Domain | Promotion |
| --- | --- | --- | --- |
| Zev broadcasts audience reaction to race/class choices and VIP positioning | Book 2, Ch. 4 | Broadcast / Social | Ledger-only (owned by #185) |
| Carl extorts exclusive Floor 6 Vengeance of the Daughter contract from Grimaldi | Book 2, Ch. 11 | Broadcast / Entitlement | Ledger-only (owned by #185) |
| Danger Zone interview interrupted by Skull Empire assassination; Manasa dies | Book 2, Ch. 18 | Broadcast / Faction | Ledger-only (owned by #185) |
| Carl, Donut, Katia finish at levels 27/26/21 and enter top-10 leaderboard | Book 2, Ch. 26 | Progression / Broadcast | Ledger-only (owned by #182/#185) |
| Hekla's group places pressure/bounties on Donut because of Mordecai | Book 2, Ch. 26 | Social / Faction | Ledger-only (owned by #185) |

## Catastrophic Floor 3 Sequence & Four Precursor Magical Shocks

Causal Sequence:
Miss Quill killed / Magistrate office destroyed
  -> Remex / Soul Leech Capacitor conflict
  -> The Final War destabilizes
  -> Fools Who Broke the Glass begins
  -> Soul Crystal enters catastrophic detonation state
  -> Carl uses Sheol Glass Reaper Case
  -> Active Soul Crystal encapsulated in inventory
  -> Carl's Doomsday Scenario created
  -> Remex emits four precursor magical shocks
  -> Party evades city-wide consequences
  -> Red Line, Car 20 stairwell
  -> Floor 4 transition
  -> Epilogue interview / Bandit Achievement / award veto

Four Precursor Magical Shock Effects:
1. Equipped magical effects temporarily fail.
2. Stored weapons activate; Conrad E explodes.
3. Specific legendary artifacts destroyed, including Enchanted Crown of the Sepsis Whore.
4. Crawler hotlist items activate, producing panic/teleportation anomalies.
