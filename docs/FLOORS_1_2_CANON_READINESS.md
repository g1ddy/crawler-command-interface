# Floors 1–2 Canon Domain Readiness Ledger

This ledger records what the current Floors 1–2 evidence can support for conditional Crawler Menu domains. It is a research and product-readiness artifact, not authored story data.

For authoring rules, source tiers, and the evidence contract, see [RAW_OBSERVATIONS.md](../RAW_OBSERVATIONS.md). The authoritative event and observation records remain [data/raw/floors/floor-1.json](../data/raw/floors/floor-1.json) and [data/raw/floors/floor-2.json](../data/raw/floors/floor-2.json).

## Decision rule

A domain becomes navigable only when a source-backed fact has a correct raw representation, replay projection, and useful behavior. A source tier is visible product context:

- **Primary**: published text, licensed audiobook, or official preview.
- **Corroborating**: maintained wiki, database, or structured summary.
- **Candidate**: discussion or search lead; not a basis for authored state.

Primary evidence is preferred for new mechanics and persistent state when available. Corroborating evidence may preserve a clearly scoped fact at its actual tier, but it never becomes primary by implication. Missing evidence means unknown, unavailable, or no feature.

## Focused readiness

| Domain | Floors 1–2 evidence | Decision |
| --- | --- | --- |
| Magic | Carl receives the basic healing spell and Donut receives Puddle Jumper on Floor 1. Floor 2 adds Protective Shell through Carl's boxers and Second Chance through the Dungeon Book. | Four source-backed spells are modeled; no Magic UI yet. |
| Pet | Mongo bonds to Donut in Floor 2 with a primary chapter locator. | Research/model candidate; a small conditional Pet capability may be meaningful. |
| Party | Groups and party-scoped achievements are referenced, but no replayable roster is modeled. | Audit only; no Party UI. |
| Crafting | Carl creates Carl's Jug O' Boom, while workbench and Sapper's-table references remain indirect. | Preserve the causal event; no workstation or Crafting UI. |
| Sponsorship | Ratings, follows, favorites, and patron limits are present. | Unavailable: these are not a sponsor relationship. |
| Messages / Scratchpad | No message artifact or sender/recipient semantics are modeled. | Unavailable. |
| Minimap | Floor and location events lack topology or navigational state. | Unavailable. |
| Generic extensions | A Book Club lead exists, but no distinct interface has been established. | Do not create a catch-all menu. |

## Magic

| Claim | Source tier and locator | Current representation | What is missing |
| --- | --- | --- | --- |
| Carl receives the basic healing spell while his HUD shows 3/3 mana. | Primary; Book 1, ch. 6. | `evt-f1-basic-healing-spell` grants `Basic healing spell` to Carl through the Magic menu tutorial. | Mechanics remain intentionally unmodeled. |
| Donut receives Puddle Jumper from post-Juicer loot boxes. | Corroborating; Bookworm Wiki, Book 1 timeline, ch. 25. | `evt-f1-puddle-jumper-granted` records the distinct spell and its loot-box acquisition. | A primary locator and mechanics remain intentionally unmodeled. |
| Donut joins the Dungeon Book of the Floor Club and receives Second Chance. | Primary; Book 1, ch. 31. | `evt-f2-005-dungeon-book-club` grants the distinct spell `Second Chance` to Donut and names the Dungeon Book as its acquisition source. | Effect mechanics and any independently evidenced persistent club unlock. |
| Enchanted BigBoi Boxers grant Protective Shell to Carl. | Corroborating; Floor 2 gear acquisition, ch. 31. | `evt-f2-protective-shell-granted` retains the source equipment instance as acquisition provenance. | Mechanics and any behavior after the equipment is lost or unequipped remain intentionally unmodeled. |

Spells remain distinct from the current `Skill` model. The projected Magic state has an explicit spell discriminator, known owner, and acquisition source, without rank, cooldown, mana cost, duration, or effect details. These four known spells are preserved for replay but do not yet provide useful management behavior, so Magic navigation remains unavailable.

Useful discovery sources include the [Book 1 guide](https://www.abookloversdigest.com/post/dungeon-crawler-carl-book-1) and the [Book 1 section summary](https://www.supersummary.com/dungeon-crawler-carl/part-2-chapters-28-36-summary/). They remain corroborating sources.

## Pet

| Claim | Source tier and locator | Current representation | What is missing |
| --- | --- | --- | --- |
| Mongo bonds to Donut and joins the Royal Court. | Primary; Book 1, ch. 40. | `evt-f2-010-mongo-bonded` is a `NarrativeEvent(kind: party-changed)`. | Machine-readable pet identity, bond holder, and any explicitly stated persistent state. |
| Mongo is present at Floor 2 exit. | Corroborating; Floor 2 exit summary, ch. 47. | Narrative summary only. | Primary check only if an independent persistence anchor is needed. |

A future pet transition should project only sourced fields. A compact Pet view could appear after the bonding sequence and disappear when replaying before it. It must not infer species, combat statistics, commands, equipment, or later-story behavior.

## Party

| Claim | Source tier and locator | Why it is insufficient |
| --- | --- | --- |
| Carl and Donut enter Floor 1 together. | Primary; Book 1, ch. 1. | Co-entry is not a machine-readable party formation or roster. |
| Party-scoped achievements occur. | Mostly corroborating achievement records. | A `recipient: party` field identifies the recipient, not membership, leader, or duration. |
| The Royal Court is named, and Mongo later joins it. | Mixed corroborating and primary leads. | No projected roster or useful teammate state exists. |

The Book Club event must not be used as a Party model. Audit party formation, members, and roles only where directly supported; keep the domain unavailable unless that produces a replayable roster and useful compact teammate state.

## Crafting

| Claim | Source tier and locator | Current representation | What it does not establish |
| --- | --- | --- | --- |
| Carl invents Carl's Jug O' Boom. | Primary; Book 1, ch. 33. | `ItemCrafted` with explicitly unknown carried quantity. | Workstation, recipe catalog, component count, or repeatable interaction. |
| Carl acquires Goo-Inator 3000, described as usable at a workbench. | Corroborating; Floor 2, ch. 31. | Persistent tool catalog entry. | Ownership or availability of a workbench. |
| Carl acquires a Proximity Trigger, described as a Sapper's-table component. | Corroborating; Floor 2, ch. 34. | Crafting-category item with unknown quantity. | Ownership or availability of a Sapper's table or workflow. |

Keep the `ItemCrafted` event in Inventory/Timeline history. New source work may add directly supported causal inputs, but Floors 1–2 must not acquire a workstation, Crafting navigation, or an inferred recipe system.

## Research sources and scope

Use Book 1 text or licensed audio when available through an official edition:

- [Author's Book 1 page](https://mattdinniman.com/books/dungeon-crawler-carl/)
- [Soundbooth Theater series](https://soundbooththeater.com/series/dungeon-crawler-carl/)
- [Audible series](https://www.audible.com/series/Dungeon-Crawler-Carl-Audiobooks/B0937JMKYV)

The current scope ends at the Floor 2 collapse. Later-book material must not justify a Floors 1–2 capability.
