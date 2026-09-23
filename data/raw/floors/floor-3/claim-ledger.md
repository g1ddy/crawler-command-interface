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

## Pet / Mongo Research (Pilot Domain #181)

Note: Research YAML is an evidence-oriented authoring format. The research compiler compiles research claims into raw JSON draft files for domain curation. Authoritative raw authoring into `data/raw/floors/floor-3/` remains a separate, reviewed step once domain representations are established.

### Direct Research-to-Authoritative Ingestion Pipeline Example (P3-PET-008)

1. **Research Claim**: `P3-PET-008` ("The party acquires a Magical Pet Carrier on Floor 3.") extracted from primary text (Book 2 Ch. 14).
2. **Modeling Decision**: `disposition: promote`, `target: { domain: "inventory", concept: "ItemAcquired" }`.
3. **Raw Compilation**: Mechanically compiled raw floor JSON draft generated directly into target raw directory (`events.json`).
4. **Domain Review & Curation**: Verified against existing CCI `ItemAcquired` schema (`item-magical-pet-carrier`).
5. **Authoritative Raw Authoring**: `evt-f3-magical-pet-carrier-acquired` authored into `data/raw/floors/floor-3/events.json` at Book 2 Ch. 14 position.

### Composite Claim Rationale (P3-PET-010)

`P3-PET-010` describes Magical Pet Carrier activation, button teleportation, containment, and rest state transitions. These are documented as an integrated item behavior in Book 2 Ch. 14. The modeling decision preserves `P3-PET-010` as a composite research observation targeting `PetDeploymentChanged` for domain review without inventing separate sub-mechanics or speculative payload fields.

| Claim ID | Claim Summary | Locator | Domain | Disposition | Promotion Status |
| --- | --- | --- | --- | --- | --- |
| P3-PET-001 | Mongo is a dungeon-generated pet-class Mongoliensis hatched on Floor 2 | Book 2, Ch. 1 / Floor 2 | Pet State | `ledger_only` | Identity (`pet-mongo`) and Donut bond persist from Floor 2; no re-acquisition on Floor 3 |
| P3-PET-002 | Mongo reaches Levels 6 (Ch. 13), 10 (Ch. 20), and 13 (Ch. 26) on Floor 3 | Book 2, Ch. 13, 20, 26 | Pet Progression | `promote` | Promoted in modeling decisions for domain review |
| P3-PET-003 | Mongo physical growth (7 inches to 13 feet) | Book 2, Ch. 5, 26 | Pet Observation | `ledger_only` | Observed physical progression; not generalized into a universal leveling formula |
| P3-PET-004 | Mongo critically wounded by spikes defending Donut from Level-8 Street Urchins | Book 2, Ch. 12 | Pet Condition | `promote` | Promoted in modeling decisions for domain review |
| P3-PET-005 | Standard heal scroll fails; healing potion + cinnamon stick + thistle rot restores Mongo | Book 2, Ch. 12 | Pet Condition | `promote` | Promoted in modeling decisions for domain review |
| P3-PET-006 | Carl installs Enchanted Fang Caps of the Expectorating Tizheruk on Mongo | Book 2, Ch. 13 | Pet Equipment | `promote` | Promoted in modeling decisions for domain review |
| P3-PET-007 | Enchanted Fang Caps produce electrical spark effect on bite attacks | Book 2, Ch. 13–14 | Pet Observation | `ledger_only` | Descriptive effect observation associated with equipped fang caps |
| P3-PET-008 | Party acquires Magical Pet Carrier on Floor 3 | Book 2, Ch. 14 | Inventory / Item | `promote` | Promoted in modeling decisions and authored into raw inventory (`evt-f3-magical-pet-carrier-acquired`) |
| P3-PET-009 | Living biological entities contained in Magical Pet Carrier before storage/teleport | Book 2, Ch. 14 | Pet / Inventory | `ledger_only` | Scoped carrier containment observation; not promoted as universal rule |
| P3-PET-010 | Magical Pet Carrier uses button-activated teleportation and rest state | Book 2, Ch. 14 | Pet Deployment | `promote` | Promoted in modeling decisions for domain review |
| P3-PET-011 | Mongo squawks and whines while resisting forced carrier teleportation | Book 2, Ch. 14 | Pet Behavior | `ledger_only` | Observable behavior; psychological distress not promoted as fact |
| P3-PET-012 | Scroll of Meat Hooks causes Mongo to abandon training and charge toward influence | Book 2, Ch. 14 | Pet Incident | `ledger_only` | Documented concrete incident; no universal aggro/saving throw/duration mechanics inferred |
| P3-PET-013 | Intelligence threshold below 2 for pet status/inventory access | Secondary sources | Pet / System | `ledger_only` | Candidate-level evidence; unverified as universal System rule |
| P3-PET-014 | Enhanced Pet Biscuit outcomes (Miriam Dom/goat, Lucia Mar/dog) | Secondary sources | Pet / Consumable | `ledger_only` | Reported secondary examples; not a verified universal mechanic |
| P3-PET-015 | Administrative pet bond transfer restrictions | Secondary sources | Pet Ownership | `ledger_only` | Secondary candidate claim requiring further primary verification |

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
