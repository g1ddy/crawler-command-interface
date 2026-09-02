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
| Pet | Mongo bonds to Donut in Floor 2 with a primary chapter locator. | Research/model candidate. Mongo is not a Party member; replace the transitional generic `party-changed` narrative classification when the Pet model is added. |
| Party | In Book 1, ch. 2, Donut becomes a crawler and forms the two-member Royal Court of Princess Donut with Carl as a member and Donut as leader. | Modeled as a replay-aware roster from the formation sequence onward. No inferred teammate stats, pet membership, or later roster changes. |
| Crafting | Carl creates Carl's Jug O' Boom, while workbench and Sapper's-table references remain indirect. | Preserve the one causal event; no workstation, recipe catalog, or Crafting UI. |
| Sponsorship | Ratings, follows, favorites, patron limits, and sponsor interest are present. | Unavailable: interest and audience metrics are not a sourced sponsor relationship, agreement, or benefit. |
| Messages / Scratchpad | Book 1 establishes chat use, but the raw timeline has no message records, participants, delivery, or text semantics. | Unavailable until message-shaped source data and a useful conversation view exist. |
| Minimap | The story establishes a Map menu/minimap-related references, but the raw timeline has no topology, nodes, visibility, or navigable location state. | Unavailable: do not turn location discoveries into a speculative map. |
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

| Claim | Source tier and locator | Current representation | Boundary |
| --- | --- | --- | --- |
| Donut becomes a crawler and forms the Royal Court of Princess Donut with Carl. | Primary; Book 1, ch. 2. Corroborating review confirms the party name and Donut's leader role. | `evt-f1-party-royal-court-formed` projects the named two-member roster. | The event is the formation anchor; their Floor 1 co-entry alone is not party evidence. |
| Donut is leader and Carl is a member. | Corroborating; Book 1 review. | `PartyMember.role` is limited to `leader` or `member`. | No unsourced level, health, equipment, class, online status, or combat role is shown. |
| Mongo bonds to Donut on Floor 2. | Primary; Book 1, ch. 40. | Not represented in Party state. | A pet's bond or membership in the Royal Court does not make it a crawler Party roster member. |
| Party-scoped achievements occur. | Mostly corroborating achievement records. | Existing `recipient: party` remains achievement metadata. | It is not used to infer a roster, leader, or duration. |

The Book Club event must not be used as Party evidence. Floors 1–2 establish the initial two-crawler roster only; later join/leave/disband changes need their own sourced transitions.

## Crafting

| Claim | Source tier and locator | Current representation | What it does not establish |
| --- | --- | --- | --- |
| Carl invents Carl's Jug O' Boom. | Primary; Book 1, ch. 33. | `ItemCrafted` with explicitly unknown carried quantity. | Workstation, recipe catalog, component count, or repeatable interaction. |
| Carl acquires Goo-Inator 3000, described as usable at a workbench. | Corroborating; Floor 2, ch. 31. | Persistent tool catalog entry. | Ownership or availability of a workbench. |
| Carl acquires a Proximity Trigger, described as a Sapper's-table component. | Corroborating; Floor 2, ch. 34. | Crafting-category item with unknown quantity. | Ownership or availability of a Sapper's table or workflow. |

Keep the `ItemCrafted` event in Inventory/Timeline history. New source work may add directly supported causal inputs, but Floors 1–2 must not acquire a workstation, Crafting navigation, or an inferred recipe system.

## Other domain corrections

The absence of a raw representation is not the same as absence from the books. The following distinctions keep this ledger useful for future data work:

- **Messages:** a known chat capability or isolated chat use is a research lead, not a chat history. Preserve actual sender, recipient, delivery, and message content before exposing Chats or Scratchpad.
- **Minimap:** menu or location references can establish that mapping exists diegetically; a usable application map still needs source-backed topology and point-in-time discovery state.
- **Sponsorship:** audience metrics, favorites, patron capacity, and sponsor interest belong to Ratings until a specific sponsorship relationship is sourced and modeled.
- **Pet:** narrative wording such as “joins the Royal Court” must be interpreted through the stated relationship. It does not override the crawler-only Party roster contract.

## Research sources and scope

Use Book 1 text or licensed audio when available through an official edition:

- [Author's Book 1 page](https://mattdinniman.com/books/dungeon-crawler-carl/)
- [Soundbooth Theater series](https://soundbooththeater.com/series/dungeon-crawler-carl/)
- [Audible series](https://www.audible.com/series/Dungeon-Crawler-Carl-Audiobooks/B0937JMKYV)

The current scope ends at the Floor 2 collapse. Later-book material must not justify a Floors 1–2 capability.
