# Second Floor Claim Ledger — Remaining Work

Source: [Dungeon Crawler Carl Wiki — Second Floor](https://dungeon-crawler-carl.fandom.com/wiki/Second_Floor) (`src-wiki-second-floor`, corroborating).

Claims that can be represented faithfully with the current raw timeline are no longer listed here. They have been added to `floor-2.json` as sourced events or observations:

- the episode-four broadcast and the complete opening announcement rule changes;
- the three exact floor-population readings, using the non-interpolated `floor-metrics.remainingCrawlers` observation;
- episode-five safe-room context and the Dungeon Codex addition for Carl's Jug O' Boom;
- the safe-room / hedgehog patch and its announced secondary safe-room countdown;
- the complete 3d11h daily patch; and
- bathroom-penalty removal at floor collapse, plus the missing boss-room achievement definition.

## Pet-domain research

The community [Pets & Dungeon Familiars](https://dungeon-crawler-carl.fandom.com/wiki/Pets_%26_Dungeon_Familiars) reference is corroborating evidence only. Its citations identify useful Book 1 chapter leads, but those citations must not be promoted to primary/confirmed provenance until the published text or licensed audio is directly inspected. Because this PR introduces no raw Pet event, the reference is intentionally kept in this research ledger rather than added to executable `sources.json`.

| Claim | Current evidence | Authoring decision |
| --- | --- | --- |
| Donut claims a caged mongoliensis from a Second Floor pet reward room. | Pets & Dungeon Familiars, Crawler Pets / Story; cites Book 1 ch. 46. | This is a distinct acquisition boundary and should eventually precede the bond transition. The current schema lacks a typed pet acquisition event, so retain it here rather than hide the fact in an unrelated item or Party event. |
| The acquired creature is initially a `pet-class mob` and is not yet bonded with a crawler. | Pets & Dungeon Familiars, AI Description / Story; cites Book 1 ch. 46. | Supports an explicit unbonded Pet state. Do not treat acquisition as immediate ownership/bond completion. |
| Mongo remains hostile after acquisition; Donut has to remove the automatic aggression before bonding can complete. | Pets & Dungeon Familiars, Bonding and the Pet Menu / Story; cites Book 1 ch. 47 for the relevant Mongo explanation. | Supports a pre-bond progression state, but exact minimap color/state semantics should remain corroborating until primary text is verified. |
| Donut hunts alongside Mongo and feeds/trains him until the bond completes late on Floor 2. | Pets & Dungeon Familiars, Bonding and the Pet Menu / Story. | Supports a causal bond-completion transition distinct from acquisition. Do not infer numeric bond progress. |
| Once bonded, Mongo is named Mongo and receives the title `Royal Steed`. | Pets & Dungeon Familiars, Bonding and the Pet Menu / Story. | Candidate fields for the bonded Pet projection. Keep title/name separate from crawler Party membership. |
| Bonding is required for the pet to continue with the crawler across a floor collapse; the reference says an unbonded pet must be left behind. | Pets & Dungeon Familiars, Bonding and the Pet Menu. | Combined with Mongo's continued presence after Floor 2, this supports persistence of the bonded relationship across the Floor 2→3 boundary. The general rule itself should remain corroborating until primary verification. |
| Bonding unlocks a Pet Menu and exposes pet-specific management/state. | Pets & Dungeon Familiars, Bonding and the Pet Menu. | This is evidence that Pet can become a useful application capability after bond completion, but #130 should decide the minimal UI only from fields actually sourced by the current story scope. |

### Typed Pet Domain Implementation (#130)

Issue #130 replaced the transitional `evt-f2-mongo-bonded` narrative event with typed Pet events:
- `evt-f2-mongo-acquired` (`PetAcquired`): Donut claims Mongo from the Floor 2 pet reward room as an unbonded, hostile pet-class mob (`pet-mongo`).
- `evt-f2-mongo-hostility-changed` (`PetHostilityChanged`): Donut removes Mongo's automatic aggression, transitioning hostility to `non-hostile`.
- `evt-f2-mongo-bonded` (`PetBonded`): Mongo completes his bond to Donut (`crawler-donut`), receiving the title `Royal Steed`.

This model establishes:
- stable pet identity (`pet-mongo`);
- dungeon-origin pet classification (`pet-class`);
- acquisition distinct from hostility removal and bonding;
- bond holder (`crawler-donut`);
- bonded/unbonded state and replay boundary;
- sourced name (`Mongo`) and title (`Royal Steed`); and
- persistence into Floor 3 without implying crawler Party membership.

Exact level, XP, stats, combat values, weaknesses, gear slots, carrier state, commands, and growth rules remain outside the Floor 2 projection unless independently sourced and represented deliberately.

## Remaining evidence that cannot yet be authored as a precise replay fact

| Claim | Why it remains | Follow-up |
| --- | --- | --- |
| **Time to Safe Room Closure** has its own safe-room HUD countdown. | The page establishes its title, target, and rule, but gives no directly observed timer value. Inventing a 4d16h value at the patch would mislabel a calculation as a reading. | The schema now permits `safe-room-closure` countdowns and the projector keeps the floor-collapse clock primary. Add a reference only when a source gives an actual reading, or explicitly introduce a derived-reference contract. |
| Safe rooms close and occupants are teleported one hour before collapse. | The timing follows a stated rule; the supplied page does not document the particular closure occurrence. | Add a causal event only after a source verifies the occurrence/participants. |
| A second `You Found Stairs!` definition for Floor 2. | The same achievement is already cataloged from Floor 1. The Floor 2 table does not prove a distinct Carl/party unlock. | Add an unlock event only with recipient and chronology evidence. |

## Story candidates requiring primary chronology

The page describes these real events, but it does not establish enough chapter-level order or payload detail for a causal replay entry. Verify against *Dungeon Crawler Carl* Book 1 before authoring:

- the Krakaren clone encounter, Brindle Grub infestation, and Rage Elemental stairwell resolution;
- Meadow Lark's descent to Floor 3;
- Mukta's schedule override, the *Death Watch Extreme Dungeon Mayhem* segment, and the rescued crawlers;
- the fabricated snick video and qualitative ratings surge; and
- Agatha's reappearance and the illegal Valtay technology discovery.

## Static reference metadata

Keep these as floor/mechanics reference rather than manufacturing replay events: layout and restroom details; safe-room variants and mailboxes; stairwell count and stasis rule; mob/boss lists and general loot; tutorial/HUD mechanics; and behind-the-scenes or speculative commentary.

## Authoring checks

- Floor population remains `floor-metrics`, never `broadcast-metrics`, and is never interpolated.
- Do not fabricate Carl's health, attributes, inventory, or social-number snapshots from this page.
- Keep the wiki corroborating; supplement causal story events with primary chapter evidence.
- Keep Mongo out of crawler Party state; Pet and Party are distinct domains even when narrative language says he joins the Royal Court.
- Do not backport later-book pet mechanics into Floor 2 merely because the Pets/Familiars reference explains them on the same page.
