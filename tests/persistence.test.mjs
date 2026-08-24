import assert from "node:assert/strict";
import test from "node:test";
import { compiledTimeline } from "../app/domain/fixtures/compiled-timeline.ts";
import {
  LocalDeviceStorageAdapter,
  InMemoryStorageAdapter,
  OptionalRemoteStorageAdapter,
  DEFAULT_STORAGE_KEY,
} from "../app/domain/persistence.ts";

class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) ?? null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

test("LocalDeviceStorageAdapter saves, loads, and clears valid timeline documents", () => {
  const storage = new MockStorage();
  const adapter = new LocalDeviceStorageAdapter(DEFAULT_STORAGE_KEY, storage);

  assert.equal(adapter.name, "local-device-storage");
  assert.equal(adapter.loadTimeline(), null);

  adapter.saveTimeline(compiledTimeline);
  const raw = storage.getItem(DEFAULT_STORAGE_KEY);
  assert.ok(raw);

  const loaded = adapter.loadTimeline();
  assert.ok(loaded);
  assert.equal(loaded.schemaVersion, compiledTimeline.schemaVersion);
  assert.equal(loaded.events.length, compiledTimeline.events.length);

  adapter.clearTimeline();
  assert.equal(adapter.loadTimeline(), null);
  assert.equal(storage.getItem(DEFAULT_STORAGE_KEY), null);
});

test("LocalDeviceStorageAdapter rejects corrupt or invalid timeline JSON", () => {
  const storage = new MockStorage();
  const adapter = new LocalDeviceStorageAdapter(DEFAULT_STORAGE_KEY, storage);

  // Non-JSON content
  storage.setItem(DEFAULT_STORAGE_KEY, "{ bad json }");
  assert.equal(adapter.loadTimeline(), null);

  // Invalid schema version
  storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify({ schemaVersion: "invalid/schema" }));
  assert.equal(adapter.loadTimeline(), null);
});

test("InMemoryStorageAdapter holds state in memory and resets cleanly", () => {
  const adapter = new InMemoryStorageAdapter();
  assert.equal(adapter.name, "in-memory-storage");
  assert.equal(adapter.loadTimeline(), null);

  adapter.saveTimeline(compiledTimeline);
  const loaded = adapter.loadTimeline();
  assert.ok(loaded);
  assert.equal(loaded.events.length, compiledTimeline.events.length);

  adapter.clearTimeline();
  assert.equal(adapter.loadTimeline(), null);
});

test("InMemoryStorageAdapter ignores invalid timeline document save attempts", () => {
  const adapter = new InMemoryStorageAdapter(compiledTimeline);
  assert.ok(adapter.loadTimeline());

  const badDoc = { schemaVersion: "bad-schema" };
  adapter.saveTimeline(badDoc);

  // State remains unchanged because bad doc was rejected
  const loaded = adapter.loadTimeline();
  assert.ok(loaded);
  assert.equal(loaded.schemaVersion, compiledTimeline.schemaVersion);
});

test("OptionalRemoteStorageAdapter syncs with remote endpoint and falls back locally", async () => {
  const localAdapter = new InMemoryStorageAdapter();
  let remoteStore = null;

  const mockFetch = async (url, options = {}) => {
    const method = options.method || "GET";
    if (method === "GET") {
      if (remoteStore) {
        return {
          ok: true,
          json: async () => remoteStore,
        };
      }
      return { ok: false, status: 404 };
    }
    if (method === "PUT") {
      remoteStore = JSON.parse(options.body);
      return { ok: true, json: async () => ({ status: "ok" }) };
    }
    if (method === "DELETE") {
      remoteStore = null;
      return { ok: true, json: async () => ({ status: "deleted" }) };
    }
    return { ok: false, status: 400 };
  };

  const remoteAdapter = new OptionalRemoteStorageAdapter(
    { endpoint: "https://api.example.com/crawler/timeline", fetchFn: mockFetch },
    localAdapter
  );

  // Save via remote adapter updates both local and remote
  await remoteAdapter.saveTimeline(compiledTimeline);
  assert.ok(remoteStore);
  assert.ok(localAdapter.loadTimeline());

  // Load via remote adapter retrieves from remote endpoint
  const loaded = await remoteAdapter.loadTimeline();
  assert.ok(loaded);
  assert.equal(loaded.schemaVersion, compiledTimeline.schemaVersion);

  // Clear removes from both
  await remoteAdapter.clearTimeline();
  assert.equal(remoteStore, null);
  assert.equal(localAdapter.loadTimeline(), null);
});

test("OptionalRemoteStorageAdapter falls back to local storage on network error", async () => {
  const localAdapter = new InMemoryStorageAdapter(compiledTimeline);

  const failingFetch = async () => {
    throw new Error("Network offline");
  };

  const remoteAdapter = new OptionalRemoteStorageAdapter(
    { endpoint: "https://api.example.com/crawler/timeline", fetchFn: failingFetch },
    localAdapter
  );

  // Load falls back to local adapter without throwing
  const loaded = await remoteAdapter.loadTimeline();
  assert.ok(loaded);
  assert.equal(loaded.schemaVersion, compiledTimeline.schemaVersion);
});
