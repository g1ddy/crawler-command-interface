# Stage 1 — Canon / Deep Research Prompt

## Purpose

Use this prompt to produce the evidence-rich human-readable research report that feeds Stage 2 of the CCI research-ingestion workflow.

This prompt is intentionally independent of CCI implementation details. The researcher should maximize evidence quality, provenance, chronology, uncertainty, and traceability.

## Prompt

> # Dungeon Crawler Carl — Pet Research for CCI
>
> ## Role
>
> You are performing canon research for an application that recreates the Crawler interface from *Dungeon Crawler Carl*.
>
> Your job is to produce an evidence-rich research report about **Pet / Pet Progression / Pet Condition / Pet Equipment / Pet Deployment**.
>
> You are a researcher, not an application designer.
>
> Do NOT invent application fields, runtime state, event names, JSON structures, or implementation details.
>
> The downstream system will separately decide how supported evidence should be modeled.
>
> ## Research scope
>
> Focus on **Book 2 / Floor 3**, while using earlier material only when necessary to establish continuity.
>
> The primary subject is Mongo and his relationship with Donut.
>
> Investigate:
>
> 1. **Mongo's progression**
>    - Level changes
>    - Explicitly stated levels
>    - Physical growth
>    - Training
>    - Combat participation
>    - Any explicitly stated progression mechanics
>
> 2. **Mongo's condition**
>    - Injuries
>    - Fatigue
>    - Recovery
>    - Rest
>    - Temporary conditions
>    - Any explicitly named condition or status
>
> 3. **Mongo's equipment**
>    - Magical fang caps
>    - Acquisition
>    - Who provides them
>    - What they demonstrably do
>    - Any other explicitly documented pet equipment
>
> 4. **Pet containment / deployment**
>    - Magical pet carrier
>    - When it is acquired
>    - Whether Mongo is active, contained, stored, released, transported, etc.
>    - Circumstances where Mongo must or may be contained
>    - Any explicit restrictions on deployment
>
> 5. **Behavioral effects**
>    - Meat Hooks
>    - Any magical, environmental, or system effect that changes Mongo's behavior
>    - Distinguish explicit effects from interpretation
>
> 6. **Pet examples used to establish the broader system**
>    - Miriam's pet/goat
>    - Lucia Mar's dog
>    - Other relevant pet examples
>
> 7. **Donut's relationship to Mongo**
>    - Bond
>    - Ownership/control language
>    - Any explicit system consequences of the relationship
>
> ## Evidence requirements
>
> Prefer sources in this order:
>
> 1. The published text of *Dungeon Crawler Carl*
> 2. Official author material
> 3. High-quality secondary sources that directly quote or accurately reference the text
> 4. Other secondary summaries only when necessary
>
> For every substantive claim, provide:
>
> - Book
> - Chapter or other precise locator when available
> - A short quotation or close textual reference where copyright limits permit
> - Source
> - Whether the evidence directly states the claim or merely supports an interpretation
>
> Do not treat a secondary summary as equivalent to primary text.
>
> ## Critical distinction: fact vs inference
>
> Explicitly distinguish:
>
> **DIRECT** — the text directly establishes the fact.
>
> **CORROBORATED** — the fact is supported by multiple sources, but the primary text may not be directly available.
>
> **INFERRED** — the fact is a reasonable interpretation but is not directly stated.
>
> **UNKNOWN** — the research does not establish the requested detail.
>
> Never convert an inference into a fact.
>
> If the text establishes that Mongo grows but gives no exact size, report the growth and mark exact size as unknown. If an event clearly occurred but no exact timestamp is given, do not invent one.
>
> ## Important negative rule
>
> Absence of evidence is NOT evidence of absence.
>
> Do not claim that Mongo did not have something unless the text explicitly establishes its absence. Instead state that no evidence was found establishing it.
>
> ## Chronology
>
> Construct a chronological Pet timeline for Floor 3.
>
> For each entry provide:
>
> - approximate sequence/order;
> - chapter when known;
> - subject;
> - event/fact;
> - evidence;
> - confidence;
> - unresolved details.
>
> Do not invent timestamps.
>
> ## Known areas to verify
>
> Specifically verify or correct:
>
> - Mongo persists from Floor 2 as Donut's bonded pet.
> - Mongo has explicitly documented progression around levels 4, 6, and 13.
> - Mongo grows physically.
> - Mongo participates in combat.
> - Mongo suffers injury.
> - Mongo experiences fatigue/rest/recovery.
> - Mongo receives magical fang caps.
> - Mongo uses a magical pet carrier.
> - Mongo can be contained/stored/released.
> - There are circumstances where pet deployment is restricted.
> - Meat Hooks has an effect on pet behavior.
> - Miriam's goat and Lucia Mar's dog provide examples relevant to the pet system.
>
> Do NOT assume any of these are correct merely because they are listed here. Verify each one.
>
> ## Separate system concepts from Mongo-specific facts
>
> Distinguish:
>
> - Mongo-specific fact;
> - Donut/Mongo relationship;
> - general pet-system rule;
> - example involving another pet;
> - interpretation.
>
> If Mongo uses a carrier, do not conclude that all pets require carriers unless the text establishes that broader rule.
>
> ## Output structure
>
> Produce a detailed Markdown research report with:
>
> 1. Executive Summary
> 2. Sources
> 3. Pet System Evidence
> 4. Mongo Chronology
> 5. Progression
> 6. Condition / Injury / Recovery
> 7. Equipment
> 8. Carrier / Deployment / Containment
> 9. Behavioral Effects
> 10. Donut / Mongo Relationship
> 11. Other Pet Examples
> 12. Explicitly Supported Facts
> 13. Corroborated but Secondary Facts
> 14. Inferences
> 15. Unknowns / Unresolved Questions
> 16. Potential Contradictions
> 17. Recommended Follow-up Research
>
> The report will be consumed by a separate LLM that converts evidence into a strict machine-readable research claim format.
>
> **Do not produce YAML or JSON.**
>
> The purpose of this stage is to maximize evidence quality, provenance, uncertainty, and traceability.
