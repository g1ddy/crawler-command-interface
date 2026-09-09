import assert from "node:assert/strict";
import test from "node:test";

import { compileRawFloorFiles } from "../../app/domain/raw-compiler.ts";
import { loadAllRawFloorDocuments } from "../../app/domain/raw-loader.ts";
import { projectState, applyEvent } from "../../app/domain/projection.ts";
import { validateCrawlerTimeline } from "../../app/domain/validation.ts";
import { createInitialState } from "../../app/domain/projection/helpers.ts";

test("Pet domain replay boundaries on Floor 2 compiled timeline", () => {
  const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());

  const acquiredEvent = compiledTimeline.events.find((e) => e.id === "evt-f2-mongo-acquired");
  const hostilityEvent = compiledTimeline.events.find((e) => e.id === "evt-f2-mongo-hostility-changed");
  const bondedEvent = compiledTimeline.events.find((e) => e.id === "evt-f2-mongo-bonded");

  assert.ok(acquiredEvent, "evt-f2-mongo-acquired exists in compiled timeline");
  assert.ok(hostilityEvent, "evt-f2-mongo-hostility-changed exists in compiled timeline");
  assert.ok(bondedEvent, "evt-f2-mongo-bonded exists in compiled timeline");

  // 1. Before acquisition: no Mongo state
  const stateBeforeAcquisition = projectState(compiledTimeline, acquiredEvent.sequence - 1);
  const mongoBefore = (stateBeforeAcquisition.pets || []).find((p) => p.petId === "pet-mongo");
  assert.equal(mongoBefore, undefined, "Mongo state must not exist before acquisition sequence");

  // 2. At acquisition: acquired, hostile, unbonded
  const stateAtAcquisition = projectState(compiledTimeline, acquiredEvent.sequence);
  const mongoAcquired = (stateAtAcquisition.pets || []).find((p) => p.petId === "pet-mongo");
  assert.ok(mongoAcquired, "Mongo pet object exists at acquisition");
  assert.equal(mongoAcquired.name, "Mongo");
  assert.equal(mongoAcquired.species, "mongoliensis");
  assert.equal(mongoAcquired.origin, "dungeon-origin");
  assert.equal(mongoAcquired.classification, "pet-class");
  assert.equal(mongoAcquired.hostility, "hostile");
  assert.equal(mongoAcquired.bondState, "unbonded");
  assert.equal(mongoAcquired.bondHolderCrawlerId, undefined);

  // 3. At hostility changed: non-hostile, unbonded
  const stateAtHostility = projectState(compiledTimeline, hostilityEvent.sequence);
  const mongoHostility = (stateAtHostility.pets || []).find((p) => p.petId === "pet-mongo");
  assert.ok(mongoHostility);
  assert.equal(mongoHostility.hostility, "non-hostile");
  assert.equal(mongoHostility.bondState, "unbonded");

  // 4. At bond completion: bonded to Donut, Royal Steed title
  const stateAtBonded = projectState(compiledTimeline, bondedEvent.sequence);
  const mongoBonded = (stateAtBonded.pets || []).find((p) => p.petId === "pet-mongo");
  assert.ok(mongoBonded);
  assert.equal(mongoBonded.bondState, "bonded");
  assert.equal(mongoBonded.bondHolderCrawlerId, "crawler-donut");
  assert.equal(mongoBonded.title, "Royal Steed");
  assert.equal(mongoBonded.hostility, "non-hostile");

  // 5. Deterministic backward scrubbing
  const replayedBeforeAcquisition = projectState(compiledTimeline, acquiredEvent.sequence - 1);
  assert.deepEqual(replayedBeforeAcquisition.pets, stateBeforeAcquisition.pets);
});

test("Pet and Party domains remain strictly independent", () => {
  const compiledTimeline = compileRawFloorFiles(loadAllRawFloorDocuments());
  const maxSeq = compiledTimeline.events.at(-1).sequence;
  const endState = projectState(compiledTimeline, maxSeq);

  assert.ok(endState.party, "Party roster exists");
  assert.equal(endState.party.members.length, 2, "Party roster contains exactly 2 crawlers");
  const memberIds = endState.party.members.map((m) => m.crawlerId);
  assert.deepEqual(memberIds, ["crawler-donut", "crawler-carl"]);
  assert.equal(memberIds.includes("pet-mongo"), false, "Mongo must never be added to Party roster");
});

test("Pet state reducers correctly handle acquisition, hostility, bonding, and classification changes", () => {
  let state = createInitialState();
  assert.deepEqual(state.pets, []);

  // PetAcquired
  state = applyEvent(state, {
    type: "PetAcquired",
    pet: {
      petId: "pet-test",
      name: "Test Pet",
      species: "cat",
      origin: "surface-origin",
      classification: "dungeon-familiar",
      hostility: "non-hostile",
      bondState: "unbonded",
    },
  });
  assert.equal(state.pets.length, 1);
  assert.equal(state.pets[0].name, "Test Pet");
  assert.equal(state.pets[0].level, undefined, "Unmodeled level remains undefined");

  // PetHostilityChanged
  state = applyEvent(state, {
    type: "PetHostilityChanged",
    petId: "pet-test",
    hostility: "hostile",
  });
  assert.equal(state.pets[0].hostility, "hostile");

  // PetBonded
  state = applyEvent(state, {
    type: "PetBonded",
    petId: "pet-test",
    bondHolderCrawlerId: "crawler-carl",
    title: "Loyal Companion",
  });
  assert.equal(state.pets[0].bondState, "bonded");
  assert.equal(state.pets[0].bondHolderCrawlerId, "crawler-carl");
  assert.equal(state.pets[0].title, "Loyal Companion");
  assert.equal(state.pets[0].hostility, "non-hostile");

  // PetClassificationChanged
  state = applyEvent(state, {
    type: "PetClassificationChanged",
    petId: "pet-test",
    classification: "crawler",
    reason: "Enhanced pet biscuit consumed",
  });
  assert.equal(state.pets[0].classification, "crawler");
  // Origin survives reclassification
  assert.equal(state.pets[0].origin, "surface-origin");
});

test("Domain validation enforces Pet event references", () => {
  const invalidDoc = {
    schemaVersion: "crawler-timeline/v2",
    timeline: { id: "test", title: "Test", story: { id: "story", title: "Story" } },
    sources: [{ id: "src-book-1", title: "Book 1", trust: "primary", kind: "official-text", url: "https://example.com", citationStyle: "Chapter {chapter}" }],
    initialState: { crawler: { name: "Carl", level: 1, attributes: {}, condition: {} } },
    events: [
      {
        id: "evt-f1-1",
        sequence: 1,
        type: "PetHostilityChanged",
        petId: "pet-unacquired",
        hostility: "non-hostile",
        position: { floor: 1 },
        summary: "Hostility change on unacquired pet",
        evidence: [{ sourceId: "src-book-1", confidence: "confirmed" }],
      },
    ],
  };

  const result = validateCrawlerTimeline(invalidDoc);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((err) => err.includes("references petId \"pet-unacquired\" which was not acquired")));
});
