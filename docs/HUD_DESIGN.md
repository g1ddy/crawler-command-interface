# HUD reinvention — executable concept brief

This document owns #160's visual decisions and comparison criteria, not canon evidence,
domain readiness, architecture, or the screenshot publication contract. Those remain in
[CANON_READINESS.md](CANON_READINESS.md), [ARCHITECTURE.md](ARCHITECTURE.md),
[SCREENSHOTS.md](SCREENSHOTS.md), and the floor-local evidence.

## Evidence into presentation

This first brief uses the repository's existing authored evidence; no additional primary
book passages were accessed. A primary label below describes the repository's citation,
not a fresh verification of the published text. Exact colors, typography, shapes, motion,
and spatial placement remain application interpretations.

| Existing evidence | Tier / locator | Visual consequence | Interpretation boundary |
| --- | --- | --- | --- |
| First Floor countdown is displayed | Corroborating, `evt-f1-countdown-start`, Floor Timeline & Patch Notes | Clock deserves a persistent, prominent location | Size, urgency thresholds, and animation are not specified canon |
| Carl's HUD shows 3/3 mana during Magic tutorial | Primary citation, Book 1 ch. 6; readiness ledger Magic row | Distinct numerical vitals, with inspectable evidence | Do not invent bars, maximums, or continuing readings |
| Party forms after Donut's reclassification | Primary/corroborating, `evt-f1-party-royal-court-formed`, Book 1 ch. 2 | Navigation must grow with the replay sequence | No always-present Party placeholder |
| Authored achievements have explicit delivery semantics | Corroborating, Floor 1 events and their `notificationDelivery` records | A reward may receive a deliberate visual treatment | Historical event selection is not a new notification arrival |
| Mongo's bond is distinct from Party | Corroborating, readiness ledger Pet section | Future Pet uses the same visual grammar but separate capability | No Pet simulation before the pending vertical slice lands |

Inference: collapse pressure and repeated system deliveries justify a stronger hierarchy
and selective theatrical emphasis. They do not justify invented AI dialogue, extra
notifications, an autonomous ticking clock, or a fictional map.

## Frontend implementation choices

Keep React, Vite, existing host adapters and typed actions. Concepts are real frontend
code reusing `CrawlerApp`, projections, feature navigation, and inspectors—not generated
screenshots or a separate simulated application. The dedicated Vite `concepts` mode emits
`dist-concepts/concepts.html`; production builds retain their existing entry point.

Concept actions are memory-only: no loading, saving, or clearing the normal device timeline.
Reload restores the compiled timeline. Changing visual concepts preserves the selected
sequence and domain. Import/export remains available for testing, without device writes.

No new runtime dependency is needed for this comparison. React Aria Components remains
the candidate for an accessible overlay migration, Motion for deliberate transitions,
and Lucide for consistent icons. Their adoption belongs to the selected design's focused
implementation PR, with lockfile and both-host validation. This phase does not claim
those libraries have been installed or evaluated in the Worker bundle.

## Competing concepts

| Concept | Composition | Strength | Tradeoff to evaluate |
| --- | --- | --- | --- |
| Authority | Horizontal identity/clock/telemetry masthead; broad workspace | Balanced information hierarchy and room for dense inventory | Less theatrical than the notice-led candidate |
| Tactical | Sticky vertical domain rail; compact header and narrower content | Fast repeat navigation and clear destination ownership | Rail costs width and requires compact-screen reflow |
| Theater | Oversized collapse notice above identity and menu ribbon | Strongest system presence and countdown emphasis | Can overemphasize a completed or stale clock; lower content density |

All use identical story state. Palette differences accompany actual composition changes;
they are not the only distinction. These are exploratory treatments, not assertions
about the books' literal appearance. Existing feature interiors are restyled for comparison,
not yet a complete domain-by-domain redesign.

## Visual grammar

- Identity, collapse context, observed vitals, and live/replay mode occupy the header.
- Replay controls stay visible in the working surface; application tools remain separate.
- Observed, estimated, unknown, stale, and unavailable have text labels. Dashed edges
  reinforce estimates/staleness; color never carries the distinction alone.
- The experimental header deliberately shows **observations**, not projection defaults,
  and labels missing readings unknown. Causal state remains available in the features.
- Readings link to their actual evidence inspector; the clock opens countdown evidence.
- Surface, text, accent, warning, and border colors are scoped CSS tokens. Layout uses
  Grid/Flexbox. No canvas, external fonts, generated artwork, or new data model.
- Only short color/border transitions run, and only without reduced-motion preference.
  Scrubbing does not replay celebratory effects or generate notification delivery.
- Touch controls have a 44px minimum height; primary new labels use 14px or larger.
  Existing feature microtext still needs a complete accessibility pass after selection.

## Comparison and acceptance

Run `npm run build:concepts`, then serve with
`npx vite preview --config vite.pages.config.ts --mode concepts` and open
`/crawler-command-interface/concepts.html` at the printed local origin.
Run `npm run test:concepts` for desktop/mobile replay checks and generated comparison PNGs
under `test-results/concepts/`. These files are not canonical screenshots and must never
be promoted by the canonical screenshot workflow.

Review each concept on: early replay before Party formation; a sourced vital reading;
live Floor 2; Inventory/Equipment; Notifications; and open evidence inspectors. Add the
Pet bond boundary after #159 is merged. Quests remain a synthetic-only test subject.

Selection must weigh canon identity, readability, information hierarchy, system personality,
replay clarity, source honesty, responsive behavior, accessibility, and implementation
cost. Source honesty and functional replay are gates, not tradeable aesthetic scores.
Provisional recommendation: Authority offers the most balanced baseline; borrow theatrical
emphasis only for genuinely delivered system moments. **No final design is selected yet.**

## Remaining #160 delivery

This branch implements the executable comparison stage, not closure of the epic.
After selection: create focused implementation issues for the shell, shared accessible
primitives, feature migration (including Pet once merged), notification/motion behavior,
responsive/accessibility verification, and canonical screenshot refresh. Production
continues to use the original presentation until a direction is approved.
