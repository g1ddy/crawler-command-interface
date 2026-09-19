# Canon Domain Readiness Ledger

This document is the durable readiness ledger for conditional Crawler Menu domains. It records what authored story evidence supports for conditional interface domains across active and future floor scopes. It is a research and capability-readiness artifact, not authored story data.

For authoring rules, source tiers, and the evidence contract, see [RAW_OBSERVATIONS.md](../RAW_OBSERVATIONS.md). The authoritative event and observation records currently remain [data/raw/floors/floor-1/](../data/raw/floors/floor-1/) and [data/raw/floors/floor-2/](../data/raw/floors/floor-2/). Floor 3 material in this ledger is research staging only until a complete Floor 3 raw authoring pass establishes its chronology and source set.

## Decision rule

A domain becomes navigable only when a source-backed fact has a correct raw representation, replay projection, and useful behavior. Source tier definitions (Primary, Corroborating, and Candidate) and evidence authoring contracts are defined in [RAW_OBSERVATIONS.md](../RAW_OBSERVATIONS.md). Missing or insufficient evidence leaves a capability unknown or unavailable.

## Focused readiness

| Domain | Current evidence | Decision |
| --- | --- | --- |
| Magic | Carl receives the basic healing spell and Donut receives Puddle Jumper on Floor 1. Floor 2 adds Protective Shell through Carl's boxers and Second Chance through the Dungeon Book. | Four source-backed spells are modeled; no Magic UI yet. |
| Pet | Floor 1 establishes Donut's pet/familiar origin and later crawler reclassification. Floor 2 establishes Mongo's acquisition, hostile/unbonded progression, bond to Donut, and persistence into the next floor. Floor 3 research supplies level/growth, combat condition, pet equipment, rest/carrier state, pet-directed control effects, and additional surface-familiar examples. | Modeled via #130 typed Pet vertical slice (`PetAcquired`, `PetHostilityChanged`, `PetBonded`, `PetClassificationChanged`). Mongo is not a Party member. Navigable when active pets exist in projected state. |
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
| Donut claims a caged mongoliensis from a Second Floor pet reward room. | Primary; Book 1 ch. 46. | `evt-f2-mongo-acquired` (`PetAcquired`) creates `pet-mongo` with species `mongoliensis` (unnamed at acquisition). | None for Floor 2 acquisition boundary. |
| The acquired creature is a `pet-class mob` and is initially unbonded. | Primary; Book 1 ch. 46. | `evt-f2-mongo-acquired` sets `classification: "pet-class"`, `hostility: "hostile"`, and `bondState: "unbonded"`. | None for initial classification and bond status. |
| Mongo begins hostile/red after acquisition, later becomes non-hostile/white while still unbonded, and only later becomes bonded/orange. | Primary; Book 1 ch. 46–47. | `evt-f2-mongo-hostility-changed` (`PetHostilityChanged`) updates hostility to `non-hostile` while remaining `unbonded`. | None; hostility and bond state are modeled separately. |
| Donut hunts with and feeds/trains Mongo until the bond completes late on Floor 2. | Primary; Book 1 ch. 46–47. | `evt-f2-mongo-acquired`, `evt-f2-mongo-hostility-changed`, and `evt-f2-mongo-bonded` express acquisition, hostility removal, and bonding. | Modeled under typed Pet domain contract. |
| Once bonded, Mongo is named Mongo and has the title `Royal Steed`. | Primary; Book 1 ch. 47. | `evt-f2-mongo-bonded` (`PetBonded`) sets `bondState: "bonded"`, `bondHolderCrawlerId: "crawler-donut"`, `name: "Mongo"`, and `title: "Royal Steed"`. | None; name and title are established at the bond boundary. |
| Mongo remains with Donut across the Floor 2→3 transition because the bond completes before collapse. | Primary; Book 1 ch. 47 and official Book 2 material placing Mongo on Floor 3. | `pet-mongo` state persists across Floor 2 into Floor 3 projection without adding Mongo to Party roster. | None for cross-floor persistence. |
| Bonding unlocks a Pet Menu and pet-specific management/state. | Corroborating; Pets & Dungeon Familiars reference, Bonding and the Pet Menu. | Navigable `PET` tab in Root Navigation unlocks dynamically when `state.pets.some(p => p.bondState === "bonded")`. | Floor 3 deployment / carrier mechanics when Floor 3 is authored. |

A future Pet projection should distinguish at least pet identity, classification/origin, acquisition, bond holder, hostility, and bond state. A compact Pet view becomes plausible only after enough sourced fields make it useful. Before the bond boundary, the UI should either be unavailable or explicitly represent only the supported unbonded state; replaying before acquisition must show no Mongo state at all.

### Floor 3 — complete research staging ledger, not authored chronology

Floor 3 has not yet been added under `data/raw/floors/`. This section intentionally captures the full current Floor 3 Pet research so it is not lost while avoiding a loader-visible partial `floor-3/` directory. When a real Floor 3 authoring pass begins, move these claims into `data/raw/floors/floor-3/claim-ledger.md`, establish `floor.json` / `catalog.json` / `sources.json`, verify exact primary chronology, and promote only supported claims into events/observations.

The research cutoff is the end of *Carl's Doomsday Scenario* / Floor 3. Later-book mechanics are explicitly excluded unless independently established inside Books 1–2.

| Floor 3 research claim | Current evidence / locator | Modeling significance | Authoring decision |
| --- | --- | --- | --- |
| Mongo arrives on Floor 3 still bonded to Donut. | High confidence; official Book 2 material explicitly places Carl, Donut, and Mongo on Floor 3, corroborated by Floor 2 bond/transition material. | Bonded Pet state persists across floors and must not be re-created as a new acquisition. | Preserve the same stable pet identity and relationship when Floor 3 is authored. |
| Mongo is a progression-bearing entity rather than a static inventory item. | High confidence; multiple chapter-level secondary sources agree on independent level progression during Floor 3. | Pet level/progression belongs to Pet state, separate from crawler XP/level. | Add numeric anchors only at verified chronology points; do not infer XP totals between them. |
| Mongo is observed around Level 4 during the circus sequence. | High confidence secondary chronology. | First known Floor 3 level anchor. | Verify exact chapter/scene against primary text before authoring a numeric transition. |
| Mongo reaches Level 6 after the Mold Lion encounter. | High confidence secondary chronology. | Distinct later level anchor and combat-linked progression. | Verify exact primary locator; do not manufacture intervening levels. |
| Mongo later reaches Level 13 on Floor 3. | High confidence secondary chronology. | Confirms substantial independent progression within the floor. | Verify exact primary locator and author only the observed level boundary. |
| Mongo physically grows as he levels, eventually becoming nearly pony-sized by the Level 13 point. | High confidence secondary chronology. | `observedSize` / growth description is a sourced changing Pet property, not a fixed species constant. | Preserve descriptive observations; do not infer dimensions or future maximum size. |
| Mongo participates directly in combat. | High confidence; chapter summaries describe him attacking during the Mold Lion encounter and later finishing remaining monsters. | Pet has active/deployed behavior and combat participation independent of Party roster membership. | Do not create a general combat-AI subsystem merely from participation; author only explicit combat/state transitions if useful. |
| Mongo can be independently injured while Donut has a different condition. | High confidence; Floor 3 sequence describes Mongo wounded/whimpering while Donut is incapacitated. | Pet health/condition is independent of owner condition. | Do not reuse `crawler-condition` automatically; #130/Floor 3 should define Pet-specific condition semantics if needed. |
| Training continues after bonding. | High confidence secondary chronology. | Bonding does not make Mongo a crawler; training/behavior remains relevant after ownership is established. | Keep training as contextual progression unless a specific state transition is worth modeling. |
| Mongo receives magical fang caps that alter his bite. | High confidence secondary chronology. | Direct early-canon evidence for Pet-specific equipment with gameplay effect. | Model the actual equipment application when exact acquisition/equip chronology is verified; do not invent a complete pet-slot taxonomy. |
| Mongo loses effectiveness when he stays awake guarding Donut instead of sleeping. | High confidence secondary chronology. | Rest/fatigue is meaningful Pet condition, not flavor text. | Preserve a Pet rest/fatigue state only at sourced boundaries; do not infer numeric stat penalties unless explicitly stated. |
| The party obtains a magical pet carrier so Mongo can sleep/rest and recover. | High confidence secondary chronology. | Carrier ownership changes Pet availability/recovery behavior. | Treat carrier as an item plus Pet deployment/rest state, not as part of Mongo's identity. |
| Mongo can be contained/stored in the carrier and later recalled/released by Donut. | High confidence secondary chronology. | Supports `active` versus `contained` deployment state and a replayable transition. | Author `stored` / `released` semantics only when exact chronology is verified. |
| Pet restrictions around the Desperado Club/context require carrier handling. | Medium-to-high confidence secondary chronology. | Location access rules can affect current Pet deployment. | Treat as contextual location/rule evidence, not a permanent Pet property. |
| In Book 2 ch. 17, Meat Hooks temporarily manipulates/draws Mongo away despite his normal bond behavior. | High confidence chapter-level secondary evidence. | Bond ownership does not mean behavior can never be overridden by effects. | Record as an event/status effect if primary chronology supports it; do not build a universal `ownershipOverride` system from one example. |
| Miriam Dom entered with fifteen goats; by the Floor 3 recap only five are visible, with three still ordinary-looking and two transformed by pet biscuits. | High confidence recap-level secondary evidence. | One crawler can have multiple surviving surface-origin animal companions; Mongo-style dungeon-pet limits cannot be naively applied to all familiar/origin categories. | Use as classification/origin evidence; do not infer a universal pet-count rule. |
| Miriam's transformed goats demonstrate divergent Enhanced Pet Biscuit outcomes; one is humanoid/armed and another is identified as a hellspawn familiar. | High confidence recap-level secondary evidence. | Transformation is not a single uniform `upgraded pet` state. | Preserve transformation outcome/classification flexibility; do not reconstruct the later complete biscuit tree. |
| Donut's own history remains evidence that surface origin survives later classification change. | Strong primary/corroborating continuity from Floors 1–3. | `origin` and `current classification` must remain separate. | Keep Donut's historical origin even after regular crawler reclassification. |
| Lucia Mar appears with two Rottweilers that remain animal companions in early material. | Corroborating early-appearance sources. | Surface-origin animals are not all transformed and are not all dungeon acquisitions. | Use conservatively as classification evidence only; later revelations about these dogs remain out of scope. |

#### Floor 3 Pet chronology handoff

The future Floor 3 claim ledger should preserve this approximate order without treating it as final until primary chapters are inspected:

1. Floor 2 → 3: Mongo persists as Donut's bonded pet.
2. Early Floor 3: training/combat continues; Level 4 observation.
3. Mold Lion sequence: Mongo participates in combat; Level 6 observation afterward.
4. Floor 3 injury sequence: Mongo has his own wounded condition while Donut is separately incapacitated.
5. Fang caps are equipped and alter Mongo's bite.
6. Rest deprivation becomes operationally relevant; magical pet carrier is acquired for containment/rest/recovery.
7. Carrier store/recall behavior becomes available; location restrictions provide context for containment.
8. Later Floor 3: Level 13 / nearly pony-sized growth observation.
9. Book 2 ch. 17 Meat Hooks incident belongs at its verified story position and demonstrates temporary pet-directed behavioral interference.

This ordering is a research scaffold, not an authored sequence. Exact chapter order must win when primary verification is performed.

#### Minimum future Floor 3 Pet event/state vocabulary suggested by the evidence

Do not create these merely because they are listed here; they are design constraints for #130 and the later Floor 3 authoring pass:

- stable Pet identity and origin/classification;
- persistent bond holder (`crawler-donut`) and bonded state carried from Floor 2;
- Pet level observations/transitions;
- observed growth/size descriptions;
- Pet-specific condition/injury state;
- Pet equipment application;
- rest/fatigue state;
- active versus carrier-contained deployment state;
- temporary effects that alter behavior without changing ownership.

The evidence supports these concepts, but the implementation should prefer the smallest reusable event set rather than one event type per row. Unknown fields remain unknown.

### Floors 1–3 ontology constraints from all animal examples

The early canon does not support a single `isPet` Boolean or a universal Mongo-shaped lifecycle. The model should be able to distinguish:

- surface-origin familiar/animal entrant;
- dungeon-origin pet-class creature;
- acquired but hostile/unbonded pet;
- acquired non-hostile but still unbonded pet;
- bonded pet tied to a specific crawler;
- transformed former familiar whose current classification differs from origin;
- ordinary surface animal companion that remains untransformed.

This is why `origin`, current classification, hostility, bond state, and owner/bond holder should be separate concepts.

### Later-book boundary

The Pets/Familiars reference combines Book 1–2 material with rules clarified much later. For a Floors 1–3 implementation, do **not** backport later evidence merely because it appears on the same reference page. In particular, keep the following out unless a Books 1–2 primary passage independently establishes the exact rule:

- detailed weakness-inspection facilities/rules;
- pet stables and expanded Bonded Pets options;
- Mongo's later-explicit Level 15 maximum physical-growth threshold;
- complete saddle/mount-management mechanics;
- later pet accessory sets and class-granted gear systems beyond the specific Floor 3 fang-cap example;
- Revitalize Pet and later healing/resurrection/regeneration/rebonding loops;
- later species-specific death/regeneration mechanics;
- the complete Enhanced Pet Biscuit probability/transformation tree;
- a hardcoded universal one-pet limit or equivalent validation rule;
- later administrative distinctions/examples used only to explain general rules retroactively.

Most importantly, do not collapse unknown into false. Floors 1–3 do not justify inventing Mongo's complete stat sheet, maximum HP, full ability list, weaknesses, exact XP, every gear slot, or every management control.

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
- [Author's Carl's Doomsday Scenario page](https://mattdinniman.com/books/carls-doomsday-scenario/)
- [Soundbooth Theater series](https://soundbooththeater.com/series/dungeon-crawler-carl/)
- [Audible series](https://www.audible.com/series/Dungeon-Crawler-Carl-Audiobooks/B0937JMKYV)
- [Pets & Dungeon Familiars](https://dungeon-crawler-carl.fandom.com/wiki/Pets_%26_Dungeon_Familiars) — corroborating research index containing both early-book and later-book material; claims must be scoped to the cited source chronology rather than copied wholesale.
- Chapter-level secondary summaries used during Floor 3 research are discovery/corroborating evidence until exact primary passages are inspected; exact numbers and chronology should be upgraded only after primary verification.

Because this PR is research-only, Pet discovery sources that are not referenced by existing raw events are intentionally kept in ledgers rather than added to executable Floor 1/2 `sources.json` catalogs.

The authoritative authored storyline currently ends at the Floor 2 collapse. Floor 3 entries in this readiness ledger are research inputs for future authoring and architecture decisions, not canonical runtime facts.
