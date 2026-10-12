# Stage 2 Extraction — Floor 3 Crawler Progression, Statistics, and Conditions

## Purpose

Convert the supplied Stage 1 research excerpt/report and any explicitly supplied supplemental evidence notes into a source-backed `crawler-research/v1` claim ledger for Issue #182. The Stage 1 document may be a bounded summary rather than the complete research report. Extract only claims supported by those supplied inputs and their identified evidence; do not assume the excerpt is exhaustive. Supplemental notes may be concise and do not need to be checked in as a full report, but must identify the source, exact URL to an accessible online source, locator where available, what it supports, and relevant limitations.

This is evidence extraction, not CCI runtime modeling or semantic validation.

## Extraction rules

1. Use only the supplied Stage 1 material and explicitly supplied supplemental evidence notes. Do not browse or fill gaps from outside knowledge. A source list alone is not evidence for a specific claim.
2. Keep claims atomic and independently useful; preserve canon terminology.
3. Preserve exact source titles, URLs, source kinds/trust, locators, and qualifications supplied by the report. An exact URL to an accessible online source is mandatory for every emitted source record and every supplemental evidence note. Each URL must resolve to the actual source page supporting the proposition; do not accept guessed URLs, generic homepages, untraceable citations, or implied physical-book access. If a claim cannot be supported by an accessible URL-backed source, do not emit it as a sourced Stage 2 claim. Never invent a URL, locator, quotation, or primary-source record.
4. Source trust and claim confidence are separate. Keep each source's actual kind/trust even when its evidence has `confirmed` confidence. This project does not have direct access to the physical books; the novel's physical text is not an expected input and primary-text inspection is not a prerequisite. Credible, materially independent secondary sites may collectively support `confirmed` confidence when their claim-specific evidence meets the threshold below. Never imply book access or ask the user to confirm a claim against the book.
5. Apply these confidence definitions to each evidence entry:
   - `confirmed`: the available evidence establishes the proposition strongly enough for this workflow. Multiple credible, materially independent online sources may collectively establish it; exceptionally strong and specific evidence from one credible source may also qualify. No material conflict remains unresolved. This does not mean the novel was inspected.
   - `corroborated`: credible evidence supports the proposition, but is narrower, less specific, less independent, or otherwise not strong enough for `confirmed`. A single credible secondary source can still be the best available evidence.
   - `candidate`: plausible but weak, incomplete, indirect, or insufficiently traceable support.
   - `disputed`: credible evidence materially conflicts or a significant ambiguity remains unresolved.
   These are not simply four levels on one ladder; `disputed` signals conflict. Count independent evidence chains, not URLs. Pages copying the same recap do not constitute independent corroboration.
5. Distinguish what a source reports from the researcher's interpretation. Preserve corroboration, contradiction, context, and uncertainty.
6. Do not infer earlier maximum level from a later level snapshot.
7. Do not calculate resulting attributes from race/class modifiers or assumed baselines. Record resulting values only when the supplied evidence explicitly reports them.
8. Do not turn unreported health, mana, stamina, XP, max values, or stat points into zero or another default.
9. An omitted/incomplete effects list is not an explicit empty list. Preserve unknown effect state unless a source explicitly reports no active effects.
10. Preserve the exact floor/countdown reference. Do not combine or convert countdowns across floors or anchors without evidence.
11. Keep conditions, onset, duration, persistence, and recovery/end boundaries distinct where evidence supports them.
12. Do not create CCI event IDs, runtime payloads, implementation types, UI behavior, or modeling dispositions.
13. Use only fields and enum values in `app/domain/schema/research-claim.schema.json`.
14. Do not include Stage 2 claims merely because they are plausible or known from outside the supplied inputs. The Stage 1 document may be an excerpt; it may not support every claim in the final Stage 2 ledger. A claim may also be supported by explicitly supplied supplemental evidence notes, but not by the extractor's outside knowledge.
15. Keep source/evidence coverage complete for the claims that are included: every evidence `sourceId` must match a source record, and each source URL must be copied exactly from the supplied material.
16. The Stage 1 input may be a bounded summary; a complete research report does not need to be checked into the repository. Supplemental evidence notes may be concise but must identify the specific source, exact URL to an accessible online source, locator where available, supported proposition, and material limitations. Preserve the full claim-level provenance in the YAML. The summary excerpt need not duplicate the full evidence ledger.

## Required coverage when supported by the supplied material

- Race/class selection and persistent modifiers.
- Level snapshots and progression anchors.
- Attribute readings and unallocated stat points.
- XP/max XP and health/mana/stamina readings.
- Injuries, unconsciousness, debuffs, beneficial/harmful effects, and recovery.
- Explicitly reported empty effect state versus effects not yet established.
- Countdown anchors and chronology qualifications.
- Unknowns, contradictions, and dependencies where actually supported.

## YAML contract

The repository schema is authoritative. The output must have this top-level shape:

```yaml
schemaVersion: crawler-research/v1
storyId: dcc
floor: 3
sources:
  - id: src-dccfansite-ch11
    kind: fan-compendium
    trust: corroborating
    title: Book 2, Chapter 11 · Unofficial DCC Index
    url: https://www.dccfansite.com/book/2/ch/11/
claims:
  - id: F3-PROG-013
    domain: crawler
    kind: event
    claim:
      summary: Carl establishes a mind-link with Grimaldi and Signet to help broker peace between them.
    evidence:
      - sourceId: src-dccfansite-ch11
        locator:
          book: 2
          chapter: 11
          section: One of Us
        relationship: supports
        confidence: corroborated
    unknowns:
      - exact_mechanism_beyond_the_reported_parasite_enabled_mind_link
```

Use the actual source URL supplied in the input. Valid claim domains include `crawler` and `floor-system` for this scope; valid kinds are `event`, `observation`, and `state`. Put `unknowns`, `dependencies`, and `contradictions` at the claim-record level, alongside `claim` and `evidence`, as defined by the schema.

Use stable claim IDs such as `F3-PROG-001`, `F3-COND-001`, and `F3-CHRON-001`. Output one YAML code block and no explanatory prose outside it.