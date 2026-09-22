# Stage 1 — Canon / Deep Research Prompt

## Purpose

Use this prompt to produce the evidence-rich human-readable research report that feeds Stage 2 of the CCI research-ingestion workflow.

This stage is **evidence research and synthesis**, not CCI modeling. The researcher should maximize evidence quality, provenance, chronology, uncertainty, traceability, and useful follow-up verification.

The researcher may not have direct access to the published books. When primary text is unavailable, use the best accessible secondary evidence and make that limitation explicit rather than presenting secondary reporting as direct canon verification.

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
> The CCI context defines the research subject and evidence needs. **Do not interpret canon evidence according to what CCI may eventually need to model.**
>
> Do NOT invent application fields, runtime state, event names, JSON structures, or implementation details.
>
> The downstream system will separately decide how supported evidence should be modeled.
>
> ## Research scope
>
> Focus on **Book 2 / Floor 3**, while using earlier or later material when it is relevant to continuity, terminology, chronology, or clarification.
>
> **Research scope is not search scope.** A Floor 3 research report may use accessible evidence from other books or later material when that evidence helps establish or qualify a Floor 3 fact. Clearly identify the chronology of that evidence rather than presenting later evidence as if it occurred on Floor 3.
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
> 6. **Pet examples used to investigate the broader system**
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
> Use the best **accessible web evidence** available. This research stage is expected to operate primarily through web-accessible secondary sources; do not assume that the published books are directly accessible.
>
> When primary text is accessible, it may be used. Otherwise, use the most specific and reasonably credible secondary source you can find. A single good-enough source may be the best available evidence for a claim; **do not require multiple sources or pad the report with redundant citations**.
>
> **Never imply that you personally inspected the books when you did not.** If a web source reports a book, chapter, scene, quotation, or other primary-text detail, preserve that information as something **reported by the web source**. Do not present it as direct verification of the underlying book.
>
> For every substantive claim, provide:
>
> - the specific web source supporting the claim;
> - page/work title and website or publication name;
> - URL when available;
> - the most precise locator available from the source;
> - a short quotation or close reference from the web source where copyright limits permit;
> - whether the source directly states the proposition or whether the research is interpreting it;
> - source quality/trust and any important accessibility limitation.
>
> If the web source itself identifies a book/chapter/scene, preserve that as a **reported primary-text locator**, not as evidence that you read the book directly.
>
> ### Source identity and reproducibility
>
> Every web source must be independently identifiable. For each web source, record:
>
> - a stable source ID;
> - the **page/work title**;
> - the **website or publication name**;
> - the **canonical URL**, when available;
> - the relevant page, section, chapter, timestamp, or other locator when available;
> - the source type (for example wiki, chapter summary, interview, article, discussion);
> - any useful indication of source authority or trust.
>
> Most evidence will come from web sources. Identify the **specific page used**, not merely a domain or generic category such as "the DCC Wiki." For non-web material mentioned by a web source, record the underlying work only as a referenced work unless you actually had direct access to it.
>
> Do not invent a URL, page title, bibliographic detail, locator, or other provenance merely to make the report look complete. If provenance is incomplete, say so.
>
> The source list should contain enough information for a human or downstream tool to locate the exact web page or work that was used.
>
> ### Source quantity and corroboration
>
> **Do not use source count as a proxy for evidence quality.** If one reasonably credible, relevant web source is the best accessible evidence, use it and state the limitation.
>
> When multiple sources are available, consider whether they add materially different evidence or simply repeat the same underlying summary. Do not call repeated web pages "independent corroboration" merely because they are separate URLs.
>
> Do not spend disproportionate effort searching for corroboration when a relevant source already provides useful evidence. Instead, focus effort on finding a more specific source, identifying disagreement, or exposing an important evidence gap.
>
> ## Evidence strength and accessibility
>
> Explicitly distinguish:
>
> **DIRECT** — the accessible source directly states the proposition. If the source is secondary, "DIRECT" means direct statement by that secondary source, not direct inspection of the novel.
>
> **CORROBORATED** — multiple materially independent sources provide useful support. This is optional; a claim does not need corroboration to be useful.
>
> **INFERRED** — the proposition is a reasonable interpretation but is not directly stated by the accessible evidence.
>
> **UNKNOWN** — the research does not establish the requested detail.
>
> Also identify when an important claim is **SECONDARY-ONLY / PRIMARY-VERIFICATION-REQUIRED**.
>
> Never convert an inference into a fact.
>
> If the evidence establishes that Mongo grows but gives no exact size, report the growth and mark exact size as unknown. If an event clearly occurred but no exact timestamp is given, do not invent one.
>
> Confidence must reflect the evidence actually available, not the apparent certainty of a repeated wiki statement.
>
> ## Claim vs source wording
>
> For important claims, distinguish:
>
> 1. **What the source says** — the narrow proposition actually reported by the accessible source.
> 2. **What the research concludes** — any interpretation or synthesis derived from that evidence.
>
> Do not silently broaden the source's wording.
>
> For example, if a chapter summary says Mongo is level 13 in Chapter 21, report that evidence as supporting Mongo being level 13 **by that point**. Do not infer the exact leveling event, date, mechanism, or causal explanation unless the evidence establishes it.
>
> ## System-wide rules vs observed behavior
>
> When identifying possible system-wide mechanics, distinguish explicitly stated rules from behavior observed in a particular example.
>
> **Do not generalize one character's experience into a system rule unless the evidence explicitly establishes that broader rule.**
>
> Organizing evidence under a system concept does not itself establish that the concept is a universal rule.
>
> For example, evidence that Mongo uses a magical carrier establishes Mongo's use of a carrier. It does not by itself establish that all pets require carriers, that all pets have a carrier state, or that the System has a universal pet-storage mechanic.
>
> ## Important negative rule
>
> Absence of evidence is NOT evidence of absence.
>
> Do not claim that Mongo did not have something unless the accessible evidence explicitly establishes its absence. Instead state that no evidence was found establishing it.
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
> When later or earlier material is used to clarify a Floor 3 event, preserve the actual chronology of both the event and the supporting source.
>
> ## Evidence gaps and verification
>
> Do not hide limitations caused by inaccessible sources.
>
> Distinguish useful evidence gaps such as:
>
> - **Not found** — the research searched for the information but did not locate supporting evidence.
> - **Unavailable** — a relevant source appears to exist but was not accessible.
> - **Insufficient precision** — the evidence supports the concept but not the requested detail.
> - **Conflicting secondary evidence** — accessible sources disagree.
> - **Primary verification required** — secondary evidence exists, but the claim should be checked against the published text before being treated as canon-confirmed.
>
> For important unresolved or secondary-only claims, create a **Primary Verification Queue** when primary-text verification would materially improve confidence. This is a follow-up task, not something you should pretend to complete without access to the book. Include:
>
> - claim/question to verify;
> - why verification matters;
> - best book/chapter/page/section locator available;
> - accessible secondary evidence supporting it;
> - conflicting or qualifying evidence, if any;
> - what remains unknown.
>
> Keep the verification queue targeted rather than exhaustive. Prioritize claims that could materially affect later understanding, especially progression, condition, equipment behavior, deployment restrictions, control/relationship mechanics, and apparent system-wide rules.
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
> - explicitly established general pet-system rule;
> - example involving another pet;
> - interpretation;
> - unresolved question.
>
> When a possible general rule is supported by only one character or one example, keep it at the narrowest supported level.
>
> ## Counter-evidence
>
> For important claims, actively look for evidence that qualifies, limits, or contradicts the claim rather than only collecting supporting evidence.
>
> A contradiction requires genuinely incompatible propositions. Different perspectives, terminology, behaviors, or System layers are not automatically contradictions.
>
> ## Output structure
>
> Produce a detailed Markdown research report with:
>
> 1. Executive Summary
> 2. Sources
> 3. Observed Pet-System Evidence
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
> 15. Evidence Gaps / Unknowns
> 16. Potential Contradictions
> 17. Primary Verification Queue
> 18. Recommended Follow-up Research
>
> The report will be consumed by a separate LLM that converts evidence into a strict machine-readable research claim format.
>
> **Do not produce YAML or JSON.**
>
> The purpose of this stage is to maximize evidence quality, provenance, uncertainty, and traceability while making the limits of accessible evidence explicit.
