# Arwes Renderer Composition Foundation

**Status:** Living design source for #238  
**Parent:** #217 — Polished Arwes Authority HUD experience  
**Related:** #214 compatibility POC, #235 HUD semantic foundation  
**Reviewed:** 2026-09-22

## Purpose

This document is the living research and design source for **#238: POC: establish the Arwes renderer composition foundation**.

Future Jules implementation issues should reference this document instead of duplicating its architectural reasoning, composition rules, scenario matrix, and verification requirements.

The goal of #238 is deliberately narrow:

> Prove that the existing renderer-neutral Crawler presentation contracts can drive a materially different Arwes experience without making Arwes the owner of Crawler meaning.

This is an architectural and visual-composition experiment. It does **not** select a final visual direction, redesign navigation, replace the production HUD, or commit the application to Arwes.

---

## Executive findings

The repository is ready for a real renderer slice, but the current Arwes implementation is still a compatibility probe rather than a composition foundation.

The important findings are:

1. **The presentation seam is already real.** CrawlerWorkspace selects authority-arwes through the existing HudPresentation boundary and passes the renderer-neutral HudCompositionModel into ArwesPresentation.
2. **The current probe is intentionally synthetic.** ArwesPresentation currently reduces the real composition model to crawlerName, floorTitle, sequence, and live/replay, then renders a compatibility/control surface. It does not yet exercise real HUD semantics, evidence, contextual content, or application-backed interaction.
3. **The foundation should consume existing presentation truth, not create a second state model.** HudCompositionModel, feature public contracts, Timeline evidence presentation, and application capabilities remain the sources of meaning.
4. **Arwes is a primitive toolkit, not a finished HUD component library.** Its own documentation describes the APIs as low/medium level and frames as structural panels/containers/separators. This matches the experiment only if Crawler-owned composition rules sit above Arwes.
5. **Frame density must be intentionally sparse.** The POC should use Arwes frames to establish hierarchy and structure, not surround every reading with a decorative border.
6. **Semantic axes must remain orthogonal.** Status, temporal position, evidence authority, change, affordance, and provenance must not be collapsed into one visual severity or frame lookup table.
7. **The minimum slice can be built from already-supported data.** A real slice can demonstrate system identity, temporal context, Crawler vitals, an evidence/inspection path, a meaningful state signal, and a real application-backed interaction without widening the domain/session boundary.
8. **The compatibility cost is already known.** The repository uses focused Arwes React packages at 1.0.0-alpha.23 with React 19 overrides. The earlier compatibility work measured approximately +28.4 kB gzip in the live client bundle. #238 should not add broad/umbrella imports without measuring why.

The architectural litmus test remains:

> If Arwes disappeared tomorrow and another renderer replaced it, the semantic meaning of the HUD would remain intact.

---

## 1. Current repository state

### Existing application path

The current runtime path is:

~~~text
Crawler session
    ↓
CrawlerWorkspace composition adapter
    ↓
HudCompositionModel
    ↓
ArwesPresentation
    ↓
Arwes compatibility probe
~~~

ShellFrame accepts the HUD as a slot and has no domain/session/persistence dependencies. This means #238 can replace the probe's interior without reopening the shell architecture.

The presentation selector already exposes:

~~~text
?hud=authority-arwes
~~~

and System Tools can switch between the existing presentation choices without creating a second session.

### Existing renderer-neutral contract

HudCompositionModel currently supplies:

- system identity: crawler name, crawler class, floor title, sequence;
- temporal context: live/replay and selected sequence;
- urgency: active countdown, formatted label, lifecycle status;
- attention: notification summary;
- vitals: health, mana, level;
- broadcast: viewers.

This is enough for the first real renderer slice.

Do **not** expand HudCompositionModel simply because a renderer wants a convenient prop. First test whether the needed information is already present, or can be composed at the existing shell/application boundary.

### Existing semantic foundation

src/presentation/semantic/ provides renderer-neutral semantic axes:

- status / presence;
- temporal position;
- authority / basis;
- change;
- affordance;
- inspectability.

src/features/timeline/evidence/evidencePresentation.ts remains the owner of detailed evidence/provenance presentation.

These layers should be treated as semantic input to the renderer, not as visual component APIs.

### Existing compatibility primitives

The current Arwes boundary already contains:

- AuthorityFrame;
- AuthoritySurface;
- AuthorityText;
- AuthorityTransition;
- AuthorityBackground.

These are useful starting points, but they are still POC primitives. Their current implementation should not be treated as final visual language.

In particular, AuthorityFrame.significance and its color map are a renderer-local experiment. They must not become a universal mapping such as:

~~~text
estimated → blue frame
causal → red frame
changed → glow
present → corners
last-known → underline
~~~

Real visual composition may consider several semantic axes together, or may intentionally render some axes through text, spacing, layout, evidence marks, or no special treatment at all.

---

## 2. What #238 is actually proving

#238 is not proving that individual Arwes components work. #214 already established that selected Arwes primitives can be mounted and exercised behind the isolated boundary.

#238 is proving that:

~~~text
source-backed truth
    ↓
existing presentation/composition contracts
    ↓
Crawler-owned visual composition
    ↓
Arwes physical primitives
~~~

can produce a coherent Crawler experience.

The experimental question is therefore:

> Does Arwes make the Crawler feel like a different kind of interface because the Crawler's hierarchy and state grammar are expressed through a different visual composition — rather than because the same dashboard was wrapped in sci-fi frames?

A successful foundation should feel like a **renderer realization of Crawler semantics**, not an Arwes demo embedded in the application.

---

## 3. Research implications from Arwes itself

The official Arwes documentation describes the framework as a collection of low/medium-level primitives intended to be composed into an application's own design system. It specifically describes Frames as suitable for structural panels, containers, and separators, and recommends simpler SVG when an effect does not need the frame machinery.

This leads to four implementation consequences.

### 3.1 Use Arwes as a physics/toolkit layer

Arwes owns:

- SVG frame rendering;
- animation mechanics;
- text effects;
- passive background effects;
- physical transition behavior.

Crawler-owned composition owns:

- what deserves persistence;
- what deserves visual priority;
- which information is contextual;
- what counts as a meaningful state transition;
- which evidence distinctions are visible at a glance;
- whether an interaction is actually actionable.

This is the practical meaning of:

> **Arwes supplies the physics. Crawler supplies the language.**

### 3.2 Frames are structural, not mandatory

A frame should answer a compositional question:

> Why does this region need a boundary?

Good uses in this POC:

- a persistent system identity/context boundary;
- a high-salience event or state region;
- a clearly separated contextual surface.

Poor uses:

- framing every telemetry number;
- framing every label;
- putting nested boxes around already-boxed content;
- using frames as the only way to communicate state;
- converting every DOM grouping into a sci-fi panel.

### 3.3 Ambient effects remain subordinate

Arwes backgrounds are designed as ambient layers and are position-absolute relative to their containing surface. They may render statically when no Animator is present.

For #238:

- use at most one ambient field in the first composition slice;
- keep it low contrast;
- keep it behind content;
- do not make animation necessary to understand state;
- do not allow it to compete with evidence, alerts, or interaction.

### 3.4 Focused imports remain the default

The repository already chose focused React package imports rather than the umbrella package. Preserve that decision.

The first real slice should use only the primitives it actually needs. Any bundle increase beyond the existing compatibility baseline should be measured and attributable.

---

## 4. Target composition model

The first composition should use a **persistent spine + contextual field** rather than a conventional dashboard grid.

Conceptually:

~~~text
┌────────────────────────────────────────────────────────────┐
│ PERSISTENT SYSTEM SPINE                                    │
│ crawler identity     floor / temporal context    urgency   │
└────────────────────────────────────────────────────────────┘

             ↓ context has visual priority ↓

┌──────────────────────── CONTEXT ───────────────────────────┐
│ selected / primary crawler information                     │
│                                                            │
│ meaningful state signal        telemetry / value           │
│ evidence class                 compact supporting detail   │
│                                                            │
│ one existing application-backed interaction                │
└────────────────────────────────────────────────────────────┘

     ambient field remains behind the composition
~~~

This is an **experimental composition**, not a final product layout.

### Persistent system spine

The first slice should make these continuously legible:

- crawler identity;
- floor/title context;
- Live vs Replay;
- collapse/urgency context when available.

The spine should establish identity and situational awareness without becoming a wall of persistent chrome.

### Contextual field

Use the existing Crawler presentation data as the first real content because it is already rich, source-aware, and established by the feature's public presentation contract.

The contextual field should prove that the renderer can show:

- a primary value or state;
- supporting telemetry;
- evidence class;
- a meaningful semantic distinction;
- one genuine application interaction.

The renderer does not need to replicate the complete CrawlerView.

### Evidence signal

Evidence should be visible but compressed.

At the glance level, a reading can expose a compact cue such as:

~~~text
HEALTH
84
OBSERVED
~~~

or:

~~~text
COLLAPSE
08:21:04
ESTIMATED
~~~

Inspection can then use the existing Timeline evidence surface.

Do not build a technical provenance panel inside this issue.

### One real interaction

Use an existing application-backed interaction already exposed by the workspace, preferably evidence inspection for a real observation.

The important property is:

~~~text
semantic model → renderer control → existing application behavior
~~~

not:

~~~text
renderer invents a new command
~~~

No new domain action is required merely to make the POC interactive.

---

## 5. Renderer layering

The implementation should be kept shallow.

Preferred conceptual layering:

~~~text
ArwesPresentation
    │
    ├── system/context region
    │      ├── identity
    │      ├── temporal context
    │      └── urgency
    │
    ├── primary contextual region
    │      ├── source-backed reading(s)
    │      ├── semantic state signal
    │      └── evidence affordance
    │
    └── one existing interaction
~~~

The existing primitive set can support this:

| Crawler-owned concern | Starting physical primitive |
| --- | --- |
| structural region | AuthorityFrame |
| unframed semantic region | AuthoritySurface |
| system text | AuthorityText |
| meaningful transition | AuthorityTransition (later refined by #239) |
| ambient layer | AuthorityBackground |

Do not create a primitive for every visual element.

### Promotion rule for new primitives

A new Crawler-owned primitive is justified when at least one of these is true:

1. the same presentation concern is needed in more than one composition;
2. the concern has a meaningful Crawler-owned vocabulary that should not expose Arwes;
3. the concern needs an independent accessibility or test contract;
4. keeping it inline would expose Arwes-specific details above the renderer boundary.

A primitive is **not** justified just because a wrapper would make the code look architecturally tidy.

---

## 6. Semantic-to-visual composition rules

The semantic layer deliberately does not tell the renderer exactly what to draw.

Use the following decision process instead:

~~~text
semantic axes
    ↓
interpret together at the composition layer
    ↓
choose hierarchy / layout / signal / evidence treatment
    ↓
realize with Crawler renderer primitives
    ↓
map to Arwes primitives
~~~

Examples:

- status = unknown should produce a truthful missing state; it does not require a particular color or frame.
- temporal = last-known should be legible as stale/historical context; it does not require an underline.
- authority = estimated should be distinguishable from observed; it does not imply a specific hue.
- change = changed may alter emphasis for a meaningful transition; it does not imply a permanent glow.
- affordance = action permits the renderer to present a real control; it does not supply the action.
- provenance.inspectable = true permits a compact inspection cue; detailed evidence stays in Timeline.

This keeps the renderer expressive without turning the semantic vocabulary into a lookup table.

---

## 7. Change and motion boundary

#239 owns the detailed motion proof, but #238 must establish the correct boundary.

The composition foundation must treat:

- **value change**;
- **attention-worthy change**;
- **visual transition implementation**

as different things.

For example, a countdown changes every second but that should not produce a full UI animation on every tick. A phase transition such as normal → warning can justify a semantic transition, while ordinary ticking is telemetry.

The eventual motion ownership chain is:

~~~text
application/feature establishes a meaningful transition
    ↓
Crawler semantic transition intent
    ↓
Crawler renderer primitive
    ↓
Arwes Animator / Animated / effect
~~~

The #238 foundation should not introduce a new animation framework or animation-token system.

---

## 8. Scenario matrix

The first renderer slice should be testable with a compact set of deterministic source-backed or presentation-level fixtures.

Use existing real data wherever available. Synthetic fixtures are appropriate for renderer-only edge cases, but must not be promoted to canonical story state.

| Scenario | Must prove |
| --- | --- |
| Live initial | persistent identity, current telemetry, hierarchy |
| Replay | temporal context changes without a second data model |
| Return to Live | presentation returns to current context without stale renderer state |
| Current observed reading | ordinary evidence class remains quiet |
| Estimated countdown | estimate is visible and inspectable |
| Last-known telemetry | stale value is not presented as current |
| Unknown value | missing truth is not converted to zero or placeholder data |
| Notification/change | attention can be expressed without making all changes loud |
| Historical/non-actionable value | information does not look like an action |
| One real interaction | existing application behavior remains reachable |
| Sparse content | hierarchy survives when there is little data |
| System Tools | application tooling remains separate from fictional HUD semantics |

### Core screenshot set

#238 should capture a small deterministic desktop set:

1. Live initial;
2. Replay;
3. meaningful changed/attention state;
4. evidence/inspectable state.

These are research artifacts for later comparison, not canonical product screenshots and not a visual winner declaration.

Responsive/accessibility validation is deeper in #242, but the renderer must not introduce obvious horizontal overflow or inaccessible structural markup.

---

## 9. Architecture rules

### Rule 1 — Arwes stays behind the boundary

All Arwes imports remain under:

~~~text
src/presentation/authority-arwes/**
~~~

### Rule 2 — No raw session state in render components

Prefer:

~~~tsx
<ArwesPresentation model={composition} />
~~~

not:

~~~tsx
<ArwesPresentation session={session} />
~~~

### Rule 3 — No raw domain event interpretation

The renderer must not search events, project state, infer capability boundaries, or reconstruct provenance.

### Rule 4 — No feature internals in Arwes components

When feature data is needed, derive it at an existing ownership boundary and pass only the narrowed presentation data needed by the renderer.

### Rule 5 — No Arwes types outside the renderer boundary

Do not add Frame*Props, AnimatorProps, Arwes theme types, or Arwes component instances to application, feature, semantic, or shell contracts unless an explicit future architecture decision creates a new boundary.

### Rule 6 — Do not create a second semantic model

Avoid an AuthorityRenderState that simply duplicates PresentationSemantics in different names.

A small local composition object is acceptable when it genuinely describes **visual composition**, but it must not redefine source truth or semantic state.

### Rule 7 — Capability remains application-owned

The renderer may receive the narrow callback or capability result necessary to realize an existing interaction, but it must not evaluate capabilities or invent actions.

### Rule 8 — Replay remains application-owned

The renderer can display the Live/Replay context already supplied by the composition model. Sequence navigation and Return to Live remain replay/application responsibilities.

---

## 10. Accessibility and stability requirements

The foundation must preserve semantic comprehension under:

### Normal motion

Meaningful transitions may animate.

### Reduced motion

The same semantic hierarchy, state, and actionability must remain legible without relying on animation.

### Deterministic mode

The same stable state must render without waiting for animation timing.

Additional requirements:

- semantic states must not depend on color alone;
- SVG frames and backgrounds must not intercept pointer input when decorative;
- informational content must use semantic HTML rather than relying on clickable-looking decoration;
- focusable controls must remain native or otherwise keyboard-accessible;
- visual emphasis must not be the only indication of actionability;
- background motion must never obscure text or interaction.

Arwes currently documents limitations around React Strict Mode and RSC, so the repository-wide React/RSC architecture must not be changed merely for the POC. The compatibility baseline already isolates the Arwes implementation and uses a targeted React dependency override.

---

## 11. Performance and dependency guidance

The compatibility research already measured a meaningful bundle increase from the selected Arwes React packages.

Record #238's additional impact separately from the existing baseline.

Requirements:

- use focused package imports;
- do not import the umbrella @arwes/react package for convenience;
- measure the production client bundle after the real slice;
- explain any additional dependency footprint;
- do not optimize prematurely with a broad architectural change;
- evaluate route/component code-splitting separately if the final direction eventually warrants it.

The current compatibility baseline measured roughly:

~~~text
+28.4 kB gzip
+23.5 kB Brotli
~~~

for the selected five Arwes React packages in the live client entry chunk.

These figures are a baseline for comparison, not a #238 acceptance threshold.

---

## 12. Implementation sequence for Jules

Jules should execute this in the following order.

### Step 1 — Replace the probe as the primary experience

Keep the compatibility probe tests where they provide value, but stop treating the synthetic probe UI as the renderer itself.

ArwesPresentation should render the real composition slice.

### Step 2 — Establish the persistent system spine

Render the existing identity + temporal + urgency presentation data.

Do not redesign navigation or replay controls.

### Step 3 — Add the contextual Crawler slice

Use the existing source-backed Crawler presentation data already owned by the Crawler feature/application composition boundary.

Keep this slice intentionally small.

### Step 4 — Add evidence and one real interaction

Render one real observed/estimated/last-known distinction and connect the compact inspection affordance to the existing application behavior.

### Step 5 — Add one meaningful state signal

Use a state that already exists in the semantic foundation. The visual treatment must be selected at the composition layer rather than by a direct semantic-to-Arwes lookup.

### Step 6 — Establish ambient treatment

Add only enough background atmosphere to establish the Authority character. Remove it completely in a local experiment and verify the composition still communicates its hierarchy.

### Step 7 — Measure and capture evidence

Run unit/architecture/build verification and capture deterministic screenshots for the comparison set.

At this point #239, #240, #241, and #242 can deepen motion, provenance, replay, and responsive/accessibility validation.

---

## 13. What success looks like

#238 succeeds when all of the following are true:

- the Arwes route renders from real HudCompositionModel data;
- the experience clearly differs from the production HUD through composition and visual hierarchy, not just decorative frames;
- system identity remains persistent but does not dominate the entire viewport;
- contextual Crawler information is the primary visual content;
- at least one semantic distinction is visibly and truthfully expressed;
- evidence is visible in compact form and can reach the existing evidence surface;
- at least one existing application-backed interaction works;
- historical/non-actionable information is not made to look like an action;
- sparse states remain intentional rather than collapsing into empty cards;
- the same renderer path works in Live and Replay;
- Arwes-specific types and imports remain isolated;
- no new semantic/provenance/capability system was created;
- deterministic rendering is stable enough for screenshots;
- the production build remains healthy and bundle impact is measured;
- no final visual direction is selected.

The key qualitative test is:

> Does the Crawler feel like it has a visual language of its own, with Arwes acting as the rendering physics underneath it?

---

## 14. Failure modes to watch for

### “Arwes card soup”

Every value gets a bordered panel and the interface loses hierarchy.

**Correction:** remove frames until only structurally meaningful boundaries remain.

### “Semantic lookup table”

Every semantic field gets a fixed color, frame, or glow.

**Correction:** compose multiple semantic axes into a local visual decision; leave some axes unrendered at glance level.

### “Probe became product”

Compatibility controls and synthetic content remain visible in the primary experience.

**Correction:** keep compatibility behavior in tests/research tooling; replace it with real presentation content.

### “Arwes is reading the domain”

Renderer code starts importing events, projections, persistence, or feature implementation files.

**Correction:** move derivation back to the owning presentation/composition boundary.

### “The renderer grew a second state system”

A new giant renderer model appears and becomes another source of semantic truth.

**Correction:** consume existing contracts directly and add only local visual composition data that cannot be confused with application truth.

### “Ambient wins”

Grid/particles/motion draw more attention than the crawler state.

**Correction:** lower or remove the ambient layer.

### “Decorative motion becomes semantic motion”

The renderer animates ordinary telemetry or repeats effects continuously.

**Correction:** let #239 own semantic transition causes; ordinary telemetry can remain visually stable.

---

## 15. Relationship to the child POCs

#238 is the physical composition foundation for the child experiments.

~~~text
#235 semantic foundation
        ↓
#238 renderer composition foundation
        ├──→ #239 semantic motion ownership
        ├──→ #240 evidence/provenance treatment
        ├──→ #241 replay/temporal experience
        └──→ #242 responsive/accessibility validation

#237 Pet promotion/research
        ↓
#243 Pet establishment/change realization

all evidence
        ↓
#217 integration + visual comparison / direction decision
~~~

The child issues should reference this document rather than repeat the foundational composition rules.

The final comparison remains intentionally under #217. This document does not declare Arwes successful or select a permanent visual direction.

---

## 16. Verification checklist

### Repository checks

- [ ] focused unit/presentation tests pass;
- [ ] architecture tests pass;
- [ ] TypeScript typecheck passes;
- [ ] lint passes;
- [ ] production live build passes;
- [ ] GitHub Pages build passes;
- [ ] full npm run verify passes.

### Browser checks

- [ ] ?hud=authority-arwes selects the presentation;
- [ ] Live renders from the real composition model;
- [ ] Replay renders without a second state model;
- [ ] Return to Live does not leave stale visual state;
- [ ] evidence inspection follows the existing application path;
- [ ] one real application-backed interaction works;
- [ ] no horizontal overflow in the representative desktop fixture;
- [ ] deterministic screenshot state is stable.

### Architecture checks

- [ ] no Arwes imports outside src/presentation/authority-arwes/**;
- [ ] no raw session/events/projection access in renderer components;
- [ ] no semantic module depends on Arwes;
- [ ] no feature depends on the renderer;
- [ ] no new provenance system;
- [ ] no capability evaluation in the renderer;
- [ ] no giant renderer-specific semantic state object.

### Research artifacts

- [ ] Live screenshot;
- [ ] Replay screenshot;
- [ ] meaningful state/change screenshot;
- [ ] evidence/inspection screenshot;
- [ ] bundle impact noted;
- [ ] any semantic vocabulary gap documented rather than worked around visually.

---

## References

### Repository

- #217 — POC: polished Arwes Authority HUD experience
- #214 — Arwes compatibility boundary POC
- #235 — HUD semantic foundation
- docs/research/arwes-authority-poc.md
- docs/research/hud-semantic-visual-language.md
- docs/ARCHITECTURE.md
- architecture-policy.json
- src/shell/hud/hud-composition.ts
- src/shell/adapters/CrawlerWorkspace.tsx
- src/presentation/authority-arwes/
- src/presentation/semantic/

### Arwes

- ARWES documentation: https://arwes.dev/docs
- ARWES React integration: https://next.arwes.dev/docs/develop/react
- ARWES Frames fundamentals: https://next.arwes.dev/docs/develop/fundamentals/frames
- ARWES React backgrounds: https://next.arwes.dev/docs/develop/react/bgs
- ARWES development fundamentals: https://next.arwes.dev/docs/develop/fundamentals

The official documentation currently describes the React packages as React 18-specific and states that React Strict Mode and React Server Components are unsupported; this remains a compatibility constraint, not a reason to weaken the Crawler application's architecture.

---

## Definition of done

- [ ] The current compatibility probe has evolved into a real renderer composition slice.
- [ ] The renderer consumes existing presentation/composition truth.
- [ ] Persistent identity and temporal context are present.
- [ ] Contextual Crawler content is source-backed.
- [ ] At least one meaningful semantic distinction is visible.
- [ ] Evidence is compact, truthful, and inspectable through existing infrastructure.
- [ ] One existing application-backed interaction works.
- [ ] Historical/non-actionable content is not presented as an action.
- [ ] Arwes remains an implementation detail behind the isolated renderer boundary.
- [ ] No second semantic/provenance/capability model was introduced.
- [ ] Deterministic browser screenshots are captured.
- [ ] Bundle impact is measured.
- [ ] Full verification passes.
- [ ] #217 remains the owner of later visual comparison and final direction evaluation.
