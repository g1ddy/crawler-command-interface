# Second Floor Claim Ledger

This ledger catalogs source-backed claims from the Dungeon Crawler Carl Wiki **Second Floor** page before they are authored into `floor-2.json`. It follows `RAW_OBSERVATIONS.md`: record the smallest claim supported by the evidence, distinguish causal events from point-in-time observations, and do not invent missing HUD state.

## Source

- **Candidate source ID:** `src-wiki-second-floor`
- **Kind:** `wiki`
- **Trust:** `corroborating`
- **Title:** `Second Floor`
- **URL:** https://dungeon-crawler-carl.fandom.com/wiki/Second_Floor
- **Primary sections used:** `Introductory Announcement`, `Mechanics`, `Mobs & Bosses`, `Story`, `Achievements`, `Floor Timeline & Patch Notes`, `Behind the Scenes`, and `Trivia`

The page should remain corroborating evidence. Exact Book 1 passages should replace or supplement it with `primary` evidence when chapter-level chronology is verified.

## Classification key

- **Event** — a discrete transition or occurrence that can change replay state or establish chronology.
- **Observation** — a sourced point-in-time reading. It does not become causal merely because the HUD can display it.
- **Metadata** — static floor/mechanic/entity information. Preserve elsewhere; do not manufacture a replay event.
- **Existing** — already represented in `data/raw/floors/floor-2.json` at least at the claim level.
- **Partial** — some of the claim exists, but important structured detail is missing.
- **Missing** — source-backed claim is not represented.
- **Model gap** — the source exposes a fact the current schema cannot faithfully express.
- **Verify primary** — useful corroborating claim whose exact recipient, chronology, or payload should be checked against Book 1 before creating a causal event.

## Timeline spine

| Countdown | Approx. PST | Claim | Classification | Current status |
| --- | --- | --- | --- | --- |
| 6d 06h | Sat Jan 7, 8:30 PM | Crawlers can begin exploring the Second Floor before formal countdown activation. | Event + countdown observation | **Existing** as `evt-f2-001-early-access` and 540,000s observation with `activationOffset: -21600`. |
| 6d 02h | Sun Jan 8, 12:30 AM | Carl and Donut arrive on the Second Floor. | Event + countdown observation | **Existing** as `evt-f2-001-entered` and 525,600s observation with `activationOffset: -7200`. |
| 6d 00h | Sun Jan 8, 2:30 AM | Formal six-day collapse countdown starts. | Event + countdown observation | **Existing** as `evt-f2-001-countdown-start` and 518,400s observation. |
| 6d 00h | Sun Jan 8, 2:30 AM | Remaining crawlers: **1,292,526**. | Observation: floor telemetry | **Missing / model gap**. Current observation kinds have no floor-population metric. Do not encode as broadcast telemetry. |
| 6d 00h | Sun Jan 8, 2:30 AM | `Dungeon Crawler World: Earth` episode 4 showcases the final 30 hours of Floor 1. | Event | **Missing** as a distinct event. |
| 5d 23h | Sun Jan 8, 3:30 AM | Cascadia gives the introductory announcement. | Event | **Existing**, but bundled with ratings activation. |
| 5d 23h | Sun Jan 8, 3:30 AM | Viewer ratings/social features become active; follows and favorites begin populating. | Event | **Partial**. `evt-f2-countdown-cascadia-intro` says ratings become active, but follows/favorites activation is not preserved structurally. Do not invent numeric values. |
| 5d 23h | Sun Jan 8, 3:30 AM | Revised patronage rules activate: three patron slots per crawler, later auctions, bid/loot-box economics. | Event / floor mechanic transition | **Missing**. Keep future floor auction timing as rule payload/context, not Floor 2 auction events. |
| 5d 23h | Sun Jan 8, 3:30 AM | Bathroom penalty activates for human-born crawlers relieving themselves outside designated bathrooms. | Event / floor mechanic transition | **Missing**. |
| 5d 23h | Sun Jan 8, 3:30 AM | Bathroom violations summon a Level 93 Rage Elemental intended to kill the offender and party. | Mechanic metadata associated with penalty activation | **Missing** as structured rule context; do not create a spawn event until an actual violation occurs. |
| 4d 20h | Mon Jan 9, 6:50 AM | Remaining crawlers: **1,033,992**. | Observation: floor telemetry | **Partial / model gap**. A NarrativeEvent anchor exists, but the number should be a sourced observation rather than causal state. |
| 4d 18h | Mon Jan 9, 8:30 AM | `Dungeon Crawler World: Earth` episode 5 airs. | Event | **Existing**. |
| 4d 18h | Mon Jan 9, 8:30 AM | Carl, Donut, and Meadow Lark are shown camped in a safe room with a Rage Elemental outside. | Event context | **Partial**; episode event exists without this scene context. |
| 4d 18h | Mon Jan 9, 8:30 AM | Carl's Jug O' Boom is added to the Dungeon Codex. | Event | **Missing**. Distinct from the earlier `ItemCrafted` event. |
| 4d 17h | Mon Jan 9, 9:30 AM | Cascadia issues a follow-up announcement / patch. | Event | **Existing**, currently summarized as one patch event. |
| 4d 17h | Mon Jan 9, 9:30 AM | Satan's Lil' Hedgehogs are relocated to a deeper floor. | Event / floor-mechanic change | **Partial** inside the patch summary. |
| 4d 17h | Mon Jan 9, 9:30 AM | Safe rooms will close one hour before floor collapse and occupants will be teleported outside. | Event / floor-mechanic change | **Partial** inside patch summary. |
| 4d 17h | Mon Jan 9, 9:30 AM | A second HUD countdown, **Time to Safe Room Closure**, appears inside safe rooms. | Countdown observation / lifecycle | **Missing / model gap**. Current countdown target only supports `floor-collapse`, and the projector assumes one countdown per floor. |
| 3d 12h | Tue Jan 10, 2:30 PM | `Dungeon Crawler World: Earth` episode 6 airs. | Event | **Existing**. |
| 3d 11h | Tue Jan 10, 3:30 PM | Remaining crawlers: **990,303**. | Observation: floor telemetry | **Partial / model gap**. A NarrativeEvent anchor exists; numeric floor telemetry does not. |
| 3d 11h | Tue Jan 10, 3:30 PM | Cascadia gives the daily announcement. | Event | **Missing** as a full patch event; only the crawler-count announcement is represented. |
| 3d 11h | Tue Jan 10, 3:30 PM | Game Guides may begin explaining Third Floor race/class selection. | Event / tutorial-mechanic transition | **Missing**. |
| 3d 11h | Tue Jan 10, 3:30 PM | Non-sapient mobs entering stairwells no longer disintegrate. | Event / stairwell-mechanic transition | **Missing**. |
| 3d 11h | Tue Jan 10, 3:30 PM | Brindled Vespa population is reduced by **50%**. | Event / mob-balance transition | **Missing**. |
| 3d 11h | Tue Jan 10, 3:30 PM | Brindled Vespa acid-spit damage is lowered slightly. | Event / mob-balance transition | **Missing**; magnitude is not stated, so do not invent one. |
| 3d 11h | Tue Jan 10, 3:30 PM | Brindle Grubs continue generating on every corpse. | Mechanic reaffirmation | **Missing**, but normally metadata rather than a causal event because behavior is explicitly retained. |
| 3d 11h | Tue Jan 10, 3:30 PM | Brindle Grubs now have only a **50%** chance to advance to pupa. | Event / mob-mechanic transition | **Missing**. |
| 2d 06h | Wed Jan 11, 8:30 PM | `Dungeon Crawler World: Earth` episode 7 airs. | Event | **Existing**. |
| 1d 00h | Fri Jan 13, 2:30 AM | `Dungeon Crawler World: Earth` episode 8 airs. | Event | **Existing**. |
| 0d 06h | Fri Jan 13, 8:30 PM | Crawlers may descend to Floor 3 without losing time; the six-hour head-start window opens. | Event + countdown observation | **Existing** as `evt-f2-countdown-floor-3-descent` and 21,600s observation. |
| 0d 01h | Sat Jan 14, ~1:30 AM | Safe rooms close and remaining occupants are teleported just outside. | Event + secondary-countdown zero point | **Missing / inferred timestamp**. Rule states closure is one hour before collapse; verify exact narrated occurrence before authoring a causal event. |
| 0d 00h | Sat Jan 14, 2:30 AM | Second Floor collapses. | Event + countdown observation | **Existing** as `evt-f2-countdown-collapse` and 0s observation. |
| 0d 00h | Sat Jan 14, 2:30 AM | Bathroom penalty is lifted when the floor collapses. | Event / mechanic deactivation | **Missing**. |

## Sourced observations

### Floor-collapse countdown

The page corroborates the following countdown anchors. These are already represented in the raw Floor 2 file unless noted otherwise.

| Remaining | Seconds | Anchor | Status |
| --- | ---: | --- | --- |
| 6d 06h | 540,000 | Floor opens for early exploration | Existing |
| 6d 02h | 525,600 | Carl and Donut arrive | Existing |
| 6d 00h | 518,400 | Formal countdown starts | Existing |
| 5d 23h | 514,800 | Cascadia intro / ratings activation | Existing |
| 4d 20h | 417,600 | 1,033,992 crawler report | Existing |
| 4d 18h | 410,400 | Episode 5 | Existing |
| 4d 17h | 406,800 | Follow-up patch | Existing |
| 3d 12h | 302,400 | Episode 6 | Existing |
| 3d 11h | 298,800 | 990,303 crawler report / daily patch | Existing |
| 2d 06h | 194,400 | Episode 7 | Existing |
| 1d 00h | 86,400 | Episode 8 | Existing |
| 0d 06h | 21,600 | unrestricted/head-start descent window | Existing |
| 0d 00h | 0 | Floor collapse | Existing |

The raw file also contains a separate ~4d04h / 360,000s countdown anchor tied to the BigBoi Boxers from another corroborating source. Preserve it; this page neither contradicts nor replaces that evidence.

### Floor population telemetry

These are point-in-time readings, not state-changing events:

| Countdown | Remaining crawlers | Current representation |
| --- | ---: | --- |
| 6d 00h | **1,292,526** | Missing entirely as a numeric observation. |
| 4d 20h | **1,033,992** | Number currently appears in NarrativeEvent prose only. |
| 3d 11h | **990,303** | Number currently appears in NarrativeEvent prose only. |

**Required model change:** add a floor-scoped telemetry observation (for example `floor-metrics.remainingCrawlers`) rather than overloading `broadcast-metrics`, which represents viewer-facing crawler metrics.

Do not interpolate crawler population between these values unless a future model explicitly opts into such estimation. Deaths occur discretely and the source supplies only snapshots.

### Safe-room closure countdown

The source explicitly establishes a second countdown named **Time to Safe Room Closure** inside safe rooms after the 4d17h patch.

Supported claims:

- the countdown exists;
- its title is `Time to Safe Room Closure`;
- its target is safe-room closure, not floor collapse;
- safe-room closure occurs one hour before floor collapse;
- it becomes relevant after the 4d17h patch.

Do **not** store `403,200` seconds at patch time as a directly stated observation merely because `4d17h - 1h = 4d16h`. That value is mathematically derived from two source claims, not quoted as an observed HUD reading.

**Required model change:** support secondary countdown targets and explicit countdown selection. Adding a second Floor 2 countdown must not cause the current `projectCountdownState` first-match behavior to replace the primary floor-collapse HUD clock.

### Broadcast/social telemetry

This page establishes activation of follows/favorites/ratings but gives no exact per-crawler values at activation. Therefore:

- author the activation as a mechanic/system event;
- do **not** create `viewers: 0`, `followers: 0`, `favorites: 0`, or any other fabricated starting values;
- retain the existing later 212 billion views / 4.4 billion followers observation from its separate Floor 2 source.

### Unsupported observation categories on this page

The page does **not** provide exact point-in-time values for Carl's:

- health, mana, or stamina;
- attributes;
- XP total or maximum XP;
- inventory quantity snapshots;
- equipment-slot snapshots;
- favorite count, patron count, leaderboard rank, or bounty.

Do not construct snapshots for these fields from surrounding prose.

## Achievement catalog

The page lists ten achievements associated with Floor 2. Catalog presence and unlock chronology are different claims: add definitions when useful, but create an `AchievementUnlocked` event only when recipient and chronology are supported.

| Achievement | Trigger / condition | Reward | Current Floor 2 catalog | Unlock-event guidance |
| --- | --- | --- | --- | --- |
| **You Found Stairs!** | Finding a stairwell down | None | **Missing locally**; identical achievement already exists in Floor 1 catalog as `achievement-found-stairs`. | Do not create another Carl/party unlock solely from this floor-level table; verify whether it repeats and when. |
| **Wait, Bosses Can Leave Their Rooms?** | Encountering a boss that left its chamber before crawlers entered | None | **Missing** | Add catalog definition; **verify primary** recipient and exact encounter before an unlock event. |
| **Dungeonpreneur** | Inventing a stackable weapon, device, or potion | One gold coin per qualifying kill made by other crawlers for inventor's natural life, adjusted for exchange rates | Existing | Existing unlock + separate permanent royalty entitlement are appropriate. |
| **What Goes Up...** | Being struck by and surviving Reverse Gravity | None | Existing | Existing unlock. |
| **Like a Moth to the Flame** | Damaging a mob more than 75 levels higher | Platinum Lucky Bastard Box | Existing | Existing unlock. |
| **Grease Monkey!** | Building and deploying a wheeled device | Silver Mechanic's Box | Existing | Existing unlock. |
| **You Call That a Trap?** | Injuring a mob with something purposely left lying around | Gold Sapper's Box | Existing | Existing unlock. |
| **I'll Take the Ceramic Dalmatian, Pat!** | Discovering a reward room | The reward room itself | Existing | Existing unlock. |
| **Menagerie!** | Discovering a pet reward room | Key to open one cage | Existing | Existing unlock. |
| **PETA Enthusiast!** | Removing hostility from an aggravated, non-sapient enemy | None | Existing | Existing unlock. |

## Story event candidates

These are discrete story claims from the page's `Story` section. They are candidates for replay chronology, but chapter placement and exact causal payload should prefer Book 1 primary evidence.

| Claim | Proposed event treatment | Status |
| --- | --- | --- |
| Carl and Donut arrive shortly before the Meadow Lark party. | Narrative chronology / party context | Entry itself existing; Meadow Lark arrival relationship missing. |
| Carl and Donut battle a Krakaren clone. | `NarrativeEvent / encounter-started` | Missing / verify primary placement. |
| Their kills trigger a massive Brindle Grub infestation. | Narrative/system consequence | Missing / verify primary placement. |
| The grub swarm traps the neighborhood/group. | Narrative consequence | Missing / verify primary placement. |
| Carl engineers the death of a Level 93 Rage Elemental. | Encounter sequence | Missing / verify primary placement. |
| Carl uses a wheeled bomb launcher called the **Mother of All Bombs**. | `ItemCrafted` or narrative deployment, depending primary wording | Missing; do not conflate it with Carl's Jug O' Boom. |
| Carl combines the launcher, an oil slick, and Donut's Puddle Jumper to lure the elemental toward the stairwell. | Narrative action / choice | Missing / verify primary. |
| The Rage Elemental enters the stairwell and is dissolved by dungeon descent rules. | `NarrativeEvent / encounter-resolved` | Missing / verify primary. |
| The Rage Elemental's destruction awards **no experience**. | Narrative outcome | Missing. Do not create `XPChanged` unless a source supplies an actual XP reading/delta. |
| Surviving Meadow Lark residents descend safely to Floor 3. | Narrative/floor-exit event | Missing / verify primary participants. |
| Admin Mukta overrides Zev's scheduling. | Narrative/admin event | Missing / verify primary. |
| Carl and Donut are forced onto `Death Watch Extreme Dungeon Mayhem`. | Narrative/media event | Missing / verify primary. |
| Carl refuses/hijacks the Maestro's intended segment. | `NarrativeEvent / choice-made` | Missing / verify primary. |
| The Maestro rescues Li Jun, Li Na, Zhang, and their manager. | `NarrativeEvent / encounter-resolved` | Missing / verify primary. |
| A fabricated “snick” video goes viral. | Narrative/media event | Missing / verify primary. |
| Carl and Donut's view counts surge after the media fallout. | Qualitative observation only | Missing; do not fabricate numeric values. |
| Mongo's automatic hostility is gradually removed. | Narrative progression | Partial; eventual bond is represented, intermediate progression is not. |
| Mongo bonds to Donut as her Royal Steed / joins the Royal Court. | `NarrativeEvent / party-changed` | **Existing** as `evt-f2-010-mongo-bonded`. |
| Agatha reappears alive at the stairwell. | Narrative discovery/encounter | Missing / verify primary. |
| Carl realizes Agatha's shopping-cart contents include illegal Valtay Corporation technology. | Narrative discovery | Missing / verify primary. Do not model as a new acquisition if the cart/items were already acquired earlier. |

## Floor-mechanic transitions and rules

These claims are useful for chronology or future mechanic modeling but should not be projected into Carl's personal state without an explicit domain contract.

### Opening-rule changes

- Floor 2 timer is cut to the six-day Syndicate legal minimum because survivor count is lower than Borant projected.
- Viewer follows and favorites activate when Cascadia's announcement ends.
- Ratings begin populating gradually.
- Crawlers are limited to three patrons.
- Patron slots are auctioned on Floors 4, 5, and 6 respectively.
- Patronage may transfer starting on Floor 7.
- Patron bids begin at one credit.
- Amount paid relative to the standard patronage fee changes Benefactor Box economics.
- Sufficient ratings/interview attention may cause enrollment in the Crawler Assisted Outreach Program and assignment of a PR agent.
- Bathroom penalty applies to human-born crawlers only; non-human pets such as Mongo are exempt.
- Bathroom penalty summons a Level 93 Rage Elemental.
- Bathroom penalty is lifted when Floor 2 collapses.

### Safe-room / stairwell rules

- Safe rooms gain mailboxes beginning on Floor 2.
- A crawler not subscribed to an applicable organization receives `Why would someone send you mail?` when trying to use the mailbox.
- Starting with the 4d17h patch, safe rooms close one hour before level collapse.
- Occupants remaining at closure are teleported just outside.
- `Time to Safe Room Closure` is a separate countdown inside safe rooms.
- All 37,500 Floor 2 stairwells are present when the floor opens.
- Descending with more than six hours left causes stasis until collapse.
- Descending with six hours or less remaining grants a head start on Floor 3 race/class selection.

### Mob-system rules

- Brindle Grubs are janitor mobs in the corpse-disposal system.
- A corpse with no nearby grubs causes the system to spawn 1–15 grubs, up to a 5,000-per-quadrant cap.
- Destroying a corpse prevents that corpse from leveling grubs but does not suppress new-grub generation.
- Sufficiently leveled grubs cocoon into pupae and emerge as Brindled Vespas.
- The 3d11h patch lowers the pupa-advance chance to 50%.
- The 3d11h patch reduces Vespa population by 50% and lowers acid-spit damage slightly.
- The 3d11h patch changes non-sapient stairwell behavior so such mobs no longer disintegrate.
- Satan's Lil' Hedgehogs are relocated to a deeper floor partway through Floor 2.
- Bosses can leave their chambers beginning on this floor.

## Static metadata: do not promote to replay events

The following page content is useful reference data but is not, by itself, a point-in-time observation or causal replay event:

- floor theme/title: Tutorial;
- six-day advertised collapse duration;
- 37,500 stairwells;
- crawler level range 1–13;
- standard mob level range 2–8;
- Level 93 Rage Elemental penalty level;
- lists of admins, managers, guides, Bopca protectors, named mobs, mobs, and bosses;
- maze/grid layout, regional separation, cinderblock/lichen/environment description;
- restroom spacing of roughly 0.25 mile and assigned single-stall behavior;
- complimentary toilet-paper rule;
- restrooms as camera/privacy blind spots;
- safe-room spacing, dining/staffing/sleeping-room variants;
- tutorial halls populating the first three floors;
- tutorial completion unlocking the full HUD/Crawler menus;
- general Floor 2 loot tables: torches, bandages, skins, organs, crafting materials, and small gold drops;
- only three Location Managers assigned to the level;
- first-morning off-screen admin report of Site Prep casualties, unless the project explicitly begins tracking off-screen world events;
- speculation about Borant/Syndicate motives or regulatory flexibility.

## Proposed implementation order

1. **Do not alter the existing floor-collapse anchors.** They already provide a strong continuous Floor 2 replay spine.
2. Add a dedicated floor-telemetry observation contract for `remainingCrawlers`, preserving the three exact snapshots without interpolation.
3. Generalize countdown targets and countdown selection so `Time to Safe Room Closure` can coexist with the primary floor-collapse clock.
4. Add the two missing achievement catalog definitions, but do not fabricate unlock events.
5. Expand the 5d23h, 4d17h, and 3d11h system announcements so their individual mechanic changes survive in structured evidence.
6. Add chapter-verified story events from Book 1 between the fixed countdown anchors.
7. Regenerate derived fixtures and run `npm run verify` after any raw JSON change.

## Acceptance checks for future authoring

- Every new event/observation cites a declared source.
- Floor population snapshots remain observations, not `BroadcastUpdated` events.
- Population values are not interpolated.
- Secondary countdowns do not replace the default floor-collapse HUD countdown.
- Calculated safe-room timer values are labeled derived unless directly observed in a source.
- Achievement definitions are not treated as proof of a particular crawler's unlock chronology.
- Existing Floor 1/Floor 2 generated fixtures remain deterministic after regeneration.
- `npm run verify` passes.
