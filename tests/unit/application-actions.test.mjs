import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import { compiledTimeline } from "../../app/domain/fixtures/compiled-timeline.ts";
import { projectState } from "../../app/domain/projection.ts";
import { executeCrawlerCommand } from "../../src/application/crawler-actions.ts";
import { validateCrawlerTimeline } from "../../app/domain/validation.ts";
import { DEFAULT_STORAGE_KEY, LocalDeviceStorageAdapter } from "../../app/domain/persistence.ts";

class MockStorage {
  store = new Map();
  getItem(key) { return this.store.get(key) ?? null; }
  setItem(key, value) { this.store.set(key, String(value)); }
  removeItem(key) { this.store.delete(key); }
}

test("valid actions append a runtime event at the live endpoint", () => {
  const previousEnd = compiledTimeline.events.at(-1).sequence;
  const result = executeCrawlerCommand(
    compiledTimeline,
    { type: "allocate-attribute", attribute: "Strength" },
    () => "evt-test-action",
  );

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.event.sequence, previousEnd + 1);
  assert.equal(result.event.type, "AttributeModified");
  assert.equal(result.event.origin, "user-runtime");
  assert.deepEqual(result.event.evidence, []);
  assert.equal(result.document.events.at(-1), result.event);
  assert.equal(validateCrawlerTimeline(result.document).valid, true);
  assert.equal(projectState(result.document, result.event.sequence).crawler.attributes.Strength,
    projectState(compiledTimeline, previousEnd).crawler.attributes.Strength + 1);
});

test("runtime actions survive validated local persistence and reprojection", () => {
  const result = executeCrawlerCommand(compiledTimeline, {
    type: "allocate-attribute",
    attribute: "Dexterity",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;

  const storage = new MockStorage();
  const adapter = new LocalDeviceStorageAdapter(DEFAULT_STORAGE_KEY, storage);
  adapter.saveTimeline(result.document);
  assert.ok(storage.getItem(DEFAULT_STORAGE_KEY));
  const loaded = adapter.loadTimeline();
  assert.ok(loaded);
  assert.equal(loaded.events.at(-1).id, result.event.id);
  assert.equal(projectState(loaded, result.event.sequence).crawler.attributes.Dexterity,
    projectState(compiledTimeline, compiledTimeline.events.at(-1).sequence).crawler.attributes.Dexterity + 1);
});

test("authored events still require evidence while runtime events cannot claim it", () => {
  const runtime = executeCrawlerCommand(compiledTimeline, {
    type: "allocate-attribute",
    attribute: "Charisma",
  });
  assert.equal(runtime.ok, true);
  if (!runtime.ok) return;

  const authoredWithoutEvidence = structuredClone(runtime.document);
  delete authoredWithoutEvidence.events.at(-1).origin;
  assert.equal(validateCrawlerTimeline(authoredWithoutEvidence).valid, false);

  const runtimeWithEvidence = structuredClone(runtime.document);
  runtimeWithEvidence.events.at(-1).evidence = compiledTimeline.events.at(-1).evidence;
  assert.equal(validateCrawlerTimeline(runtimeWithEvidence).valid, false);
});

test("actions append to live state without changing historical projection", () => {
  const replaySequence = 40;
  const before = projectState(compiledTimeline, replaySequence);
  const result = executeCrawlerCommand(compiledTimeline, {
    type: "equip-item",
    instanceId: "inst-f1-trollskin-shirt",
  });

  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.deepEqual(projectState(result.document, replaySequence), before);
  assert.equal(result.event.sequence, compiledTimeline.events.at(-1).sequence + 1);
  assert.equal(projectState(result.document, result.event.sequence).inventory
    .find((item) => item.instanceId === "inst-f1-trollskin-shirt").isEquipped, true);
});

test("equipment workspace can explicitly equip ordinary gear into SPECIAL", () => {
  const result = executeCrawlerCommand(compiledTimeline, {
    type: "equip-item",
    instanceId: "inst-f1-trollskin-shirt",
    requestedSlot: "SPECIAL",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.event.slot, "SPECIAL");
  const state = projectState(result.document, result.event.sequence);
  assert.equal(state.equippedSlots.SPECIAL, "inst-f1-trollskin-shirt");
});

test("invalid commands and domain eligibility failures do not append", () => {
  const junk = executeCrawlerCommand(compiledTimeline, {
    type: "equip-item",
    instanceId: "inst-f1-goblin-copper-chopper",
  });
  assert.deepEqual(junk, { ok: false, error: "Only equipment can be equipped." });

  const missing = executeCrawlerCommand(compiledTimeline, {
    type: "consume-item",
    instanceId: "missing-item",
  });
  assert.deepEqual(missing, { ok: false, error: "Item is not present in the live inventory." });

  const invalidSlot = executeCrawlerCommand(compiledTimeline, {
    type: "assign-hotlist-slot",
    slot: 10,
    skillId: "missing-skill",
  });
  assert.deepEqual(invalidSlot, { ok: false, error: "Hotlist slot must be between 0 and 9." });

  const invalidEquipmentSlot = executeCrawlerCommand(compiledTimeline, {
    type: "equip-item",
    instanceId: "inst-f1-trollskin-shirt",
    requestedSlot: "NOT-A-SLOT",
  });
  assert.deepEqual(invalidEquipmentSlot, { ok: false, error: "Requested equipment slot is not supported." });

  const sequence = compiledTimeline.events.at(-1).sequence + 1;
  const restrictedDocument = {
    ...compiledTimeline,
    events: [...compiledTimeline.events, {
      id: "evt-test-restricted-item",
      sequence,
      type: "ItemAcquired",
      position: { ...compiledTimeline.events.at(-1).position },
      summary: "Test-only restricted equipment",
      evidence: compiledTimeline.events.at(-1).evidence,
      item: {
        instanceId: "restricted-item",
        name: "Restricted Item",
        category: "equipment",
        quantity: 1,
        requirements: { Strength: 9999 },
      },
    }],
  };
  const unmetRequirements = executeCrawlerCommand(restrictedDocument, {
    type: "equip-item",
    instanceId: "restricted-item",
  });
  assert.deepEqual(unmetRequirements, { ok: false, error: "Cannot equip: requirements not met." });
});

test("feature components depend on focused actions rather than raw event callbacks", () => {
  const featureFiles = [
    "src/features/crawler/CrawlerView.tsx",
    "src/features/crawler/stats/PlayerStats.tsx",
    "src/features/inventory/InventoryView.tsx",
    "src/features/inventory/ItemInspector.tsx",
    "src/features/inventory/equipment/EquipmentView.tsx",
    "src/features/skills/SkillsView.tsx",
  ];
  for (const file of featureFiles) {
    const source = fs.readFileSync(file, "utf8");
    assert.doesNotMatch(source, /Partial<CrawlerEvent>|onEmitEvent/);
  }
});
