# Canon Domain Readiness Ledger

This document is the durable readiness ledger for conditional Crawler Menu domains. It records what authored story evidence supports for conditional interface domains across active and future floor scopes. It is a research and capability-readiness artifact, not authored story data.

For authoring rules, source tiers, and the evidence contract, see [RAW_OBSERVATIONS.md](../RAW_OBSERVATIONS.md). The authoritative event and observation records currently remain [data/raw/floors/floor-1/](../data/raw/floors/floor-1/) and [data/raw/floors/floor-2/](../data/raw/floors/floor-2/). Floor 3 material in this ledger is research staging only until a complete Floor 3 raw authoring pass establishes its chronology and source set.

## Decision rule

A domain becomes navigable only when a source-backed fact has a correct raw representation, replay projection, and useful behavior. Source tier definitions (Primary, Corroborating, and Candidate) and evidence authoring contracts are defined in [RAW_OBSERVATIONS.md](../RAW_OBSERVATIONS.md). Missing or insufficient evidence leaves a capability unknown or unavailable.

## Focused readiness

| Domain | Current evidence | Decision |
| --- | --- | --- |
| Magic | Carl receives the basic healing spell and Donut receives Puddle Jumper on Floor 1. Floor 2 adds Protective Shell through Carl's boxers and Second Chance through the Dungeon Book. | Four source-backed spells are modeled; no Magic UI yet. |
| Pet | Floor 1 establishes Donut's pet/familiar origin and later crawler reclassification. Floor 2 establishes Mongo's acquisition, unbonded period, bond to Donut, and persistence into the next floor. Floor 3 research shows enough continuing pet state to justify a richer eventual model, but Floor 3 is not yet authored. | Ready for the #130 Pet model vertical slice. Mongo is not a Party member; replace the transitional generic `party-changed` narrative classification with a typed Pet contract before adding Pet navigation. |
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
| Donut joins the Dungeon Book of the Floor Club and receives Second Chance. | Primary; Book 1, ch. 31. | `evt-f2-dungeon-book-club` grants the distinct spell `Second Chance` to Donut and names the Dungeon Book as its acquisition source. | Effect mechanics and any independently evidenced persistent club unlock. |
| Enchanted BigBoi Boxers grant Protective Shell to Carl. | Corroborating; Floor 2 gear acquisition, ch. 31. | `evt-f2-protective-shell-granted` retains the source equipment instance as acquisition provenance. | Mechanics and any behavior after the equipment is lost or unequipped remain intentionally unmodeled. |

Spells remain distinct from the current `Skill` model. The projected Magic state has an explicit spell discriminator, known owner, and acquisition source, without rank, cooldown, mana cost, duration, or effect details. These four known spells are preserved for replay but do not yet provide useful management behavior, so Magic navigation remains unavailable.

Useful discovery sources include the [Book 1 guide](https://www.abookloversdigest.com/post/dungeon-crawler-carl-book-1) and the [Book 1 section summary](https://www.supersummary.com/dungeon-crawler-carl/part-2-chapters-28-36-summary/). They remain corroborating sources.

## Pet

The Pet evidence spans more than Mongo's final bond. The model should preserve classification, acquisition, bond state, and owner separately so later progression does not force those concepts into one event.

### Floor 1 — Donut's classification transition

| Claim | Source tier and locator | Current representation | What is missing |
| --- | --- | --- | --- |
| Donut enters as Carl's biological cat and is initially treated as a pet/familiar rather than a normal trained crawler. | Corroborating; Pets & Dungeon Familiars reference, Classification / Dungeon Familiars, citing early Book 1 material. | No typed Pet/classification state. | Primary verification and a classification contract distinct from Party. |
| Donut has a crawler ID and level before regular crawler reclassification but no class at that point. | Corroborating; Pets & Dungeon Familiars reference, Dungeon Familiars / Story, citing Book 1 ch. 2. | Not represented. | Primary verification and optional fields that preserve unknowns instead of manufacturing crawler completeness. |
| An enhanced pet biscuit causes Donut's transition from pet/familiar to regular crawler before the Royal Court is formed. | Corroborating; Pets & Dungeon Familiars reference, Story. | `evt-f1-party-royal-court-formed` begins after the transition but does not represent it. | A typed classification transition if #130 determines the history is necessary to the Pet model. |

The existing Party formation remains correct and should not be overloaded with Donut's prior pet status. Origin/classification history is Pet-domain evidence; crawler Party membership begins only after Donut is a crawler.

### Floor 2 — Mongo acquisition and bond

| Claim | Source tier and locator | Current representation | What is missing |
| --- | --- | --- | --- |
| Donut claims a caged mongoliensis from a Second Floor pet reward room. | Corroborating; Pets & Dungeon Familiars reference, Crawler Pets / Story; cites Book 1 ch. 46. | No acquisition event. | Primary verification and a typed `PetAcquired`-style transition or equivalent. |
| The acquired creature is a `pet-class mob` and is initially unbonded. | Corroborating; Pets & Dungeon Familiars reference, AI Description / Story. | No projected pre-bond state. | Stable pet ID, classification, acquisition sequence, and bond status. |
| Mongo's automatic hostility must be removed before bonding completes. | Corroborating; Pets & Dungeon Familiars reference, Bonding and the Pet Menu / Story. | Not represented. | A minimal bond-state model; do not infer numeric bond progress. |
| Donut hunts with and feeds/trains Mongo until the bond completes late on Floor 2. | Corroborating; Pets & Dungeon Familiars reference, Story. | `evt-f2-mongo-bonded` is a `NarrativeEvent(kind: party-changed)`. | Replace the transitional kind with typed Pet semantics and verify the exact primary chronology. |
| Once bonded, Mongo is named Mongo and has the title `Royal Steed`. | Corroborating; Pets & Dungeon Familiars reference, Story / Bonding. | Narrative text only. | Verify whether name/title are established at the same replay boundary and preserve only sourced values. |
| Mongo remains with Donut across the Floor 2→3 transition. | Corroborating; Floor 2 exit material plus continuing Floor 3 references. | Narrative continuity only. | Typed persistent bond state; do not convert Mongo into crawler Party membership. |

A future Pet projection should distinguish at least pet identity, classification/origin, acquisition, bond holder, and bond state. A compact Pet view becomes plausible only after the bonded state exists and enough sourced fields make it useful. Before the bond boundary, the UI should either be unavailable or explicitly represent only the supported unbonded state; replaying before acquisition must show no Mongo state at all.

### Floor 3 — research staging, not authored chronology

Floor 3 has not yet been added under `data/raw/floors/`. The following findings are retained only to prevent #130 from choosing a model that immediately dead-ends when Floor 3 is authored. They must not be compiled, projected, or exposed as canonical Floor 3 state until a dedicated Floor 3 source/chronology pass verifies them.

| Research lead | Why it matters to the model | Current decision |
| --- | --- | --- |
| Mongo continues to gain levels and physically grows during Floor 3. | Pet progression is persistent and distinct from crawler level/XP. | Do not add numeric level/XP fields to the current projection unless a Floor 3 primary chronology supplies exact anchors. |
| Mongo participates in combat and can be injured/recovered. | Pet condition may eventually require its own health/recovery semantics. | Do not reuse crawler-condition observations automatically. |
| Pet-specific gear such as fang caps appears by this scope. | Pet equipment is a distinct ownership/equipment concern. | Keep out of #130's minimum slice unless exact acquisition/equip events are verified. |
| A magical carrier is used to contain/rest/recover a pet. | Deployed/contained state is potentially meaningful and replayable. | Treat as a later Pet capability extension, not a prerequisite for the initial Pet UI. |
| Other pets/familiars demonstrate that surface familiars and dungeon-origin crawler pets are related but not identical classifications. | The model should not encode Mongo's origin as the universal definition of `pet`. | Prefer explicit `origin`/classification over a single boolean `isPet`. |

These Floor 3 leads justify designing #130 around an extensible Pet identity/classification/bond core rather than a one-off `MongoBonded` event. They do **not** justify importing later-book mechanics into the current raw timeline.

### Later-book boundary

The Pets/Familiars reference combines Book 1 material with rules clarified in much later books. For a Floors 1–3 implementation, do not backport later evidence merely because it appears on the same reference page. In particular, later pet-stable options, later transformation-tree detail, later regeneration species mechanics, later accessory sets, later administrative distinctions, and later examples of pet-limit exceptions remain outside the current model unless Books 1–2 independently establish the same fact.

## Party

| Claim | Source tier and locator | Current representation | Boundary |
| --- | --- | --- | --- |
| Donut becomes a crawler and forms the Royal Court of Princess Donut with Carl. | Primary; Book 1, ch. 2. Corroborating review confirms the party name and Donut's leader role. | `evt-f1-party-royal-court-formed` projects the named two-member roster. | The event is the formation anchor; their Floor 1 co-entry alone is not party evidence. |
| Donut is leader and Carl is a member. | Corroborating; Book 1 review. | `PartyMember.role` is limited to `leader` or `member`. | No unsourced level, health, equipment, class, online status, or combat role is shown. |
| Mongo bonds to Donut on Floor 2. | Pet-domain evidence; current raw event is transitional. | Not represented in Party state. | A pet's bond or membership in the Royal Court does not make it a crawler Party roster member. |
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

Use published text or licensed audio when available through an official edition. Community references are useful corroborating discovery sources but must retain their actual source tier.

- [Author's Dungeon Crawler Carl page](https://mattdinniman.com/books/dungeon-crawler-carl/)
- [Soundbooth Theater series](https://soundbooththeater.com/series/dungeon-crawler-carl/)
- [Audible series](https://www.audible.com/series/Dungeon-Crawler-Carl-Audiobooks/B0937JMKYV)
- [Pets & Dungeon Familiars](https://dungeon-crawler-carl.fandom.com/wiki/Pets_%26_Dungeon_Familiars) — corroborating research index containing both early-book and later-book material; claims must be scoped to the cited source chronology rather than copied wholesale.

The authoritative authored storyline currently ends at the Floor 2 collapse. Floor 3 entries in this readiness ledger are research inputs for future authoring and architecture decisions, not canonical runtime facts.
