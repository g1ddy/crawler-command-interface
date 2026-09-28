import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { writeJsonFixtureIfChanged } from '../../scripts/sync-derived-fixtures.mjs';

test('writeJsonFixtureIfChanged suppresses timestamp-only churn', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'compiled-timeline.json');

  try {
    const existingData = {
      schemaVersion: 'crawler-timeline/v2',
      timeline: {
        id: 'tl-1',
        title: 'Timeline',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      events: [{ id: 'evt-1', type: 'NarrativeEvent' }],
    };
    writeFileSync(targetFile, `${JSON.stringify(existingData, null, 2)}\n`, 'utf8');

    const generatedData = {
      schemaVersion: 'crawler-timeline/v2',
      timeline: {
        id: 'tl-1',
        title: 'Timeline',
        createdAt: '2026-09-28T12:00:00.000Z',
        updatedAt: '2026-09-28T12:00:00.000Z',
      },
      events: [{ id: 'evt-1', type: 'NarrativeEvent' }],
    };

    const result = writeJsonFixtureIfChanged(targetFile, generatedData);
    assert.equal(result.written, false);
    assert.equal(result.reason, 'timestamp_only_churn');

    const contentOnDisk = readFileSync(targetFile, 'utf8');
    assert.equal(contentOnDisk, `${JSON.stringify(existingData, null, 2)}\n`);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeJsonFixtureIfChanged writes meaningful output changes', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'compiled-timeline.json');

  try {
    const existingData = {
      schemaVersion: 'crawler-timeline/v2',
      timeline: {
        id: 'tl-1',
        title: 'Timeline',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      events: [{ id: 'evt-1', type: 'NarrativeEvent' }],
    };
    writeFileSync(targetFile, `${JSON.stringify(existingData, null, 2)}\n`, 'utf8');

    const generatedData = {
      schemaVersion: 'crawler-timeline/v2',
      timeline: {
        id: 'tl-1',
        title: 'Timeline',
        createdAt: '2026-09-28T12:00:00.000Z',
        updatedAt: '2026-09-28T12:00:00.000Z',
      },
      events: [
        { id: 'evt-1', type: 'NarrativeEvent' },
        { id: 'evt-2', type: 'ItemAcquired' },
      ],
    };

    const result = writeJsonFixtureIfChanged(targetFile, generatedData);
    assert.equal(result.written, true);
    assert.equal(result.reason, 'data_changed');

    const contentOnDisk = JSON.parse(readFileSync(targetFile, 'utf8'));
    assert.equal(contentOnDisk.events.length, 2);
    assert.equal(contentOnDisk.timeline.createdAt, '2026-01-01T00:00:00.000Z');
    assert.equal(contentOnDisk.timeline.updatedAt, '2026-09-28T12:00:00.000Z');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeJsonFixtureIfChanged preserves pre-modified user work when non-timestamp data is edited', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'compiled-timeline.json');

  try {
    const preModifiedData = {
      schemaVersion: 'crawler-timeline/v2',
      timeline: {
        id: 'tl-1',
        title: 'Timeline - User Local Edit',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      events: [{ id: 'evt-1', type: 'NarrativeEvent', note: 'local draft' }],
    };
    writeFileSync(targetFile, `${JSON.stringify(preModifiedData, null, 2)}\n`, 'utf8');

    const generatedData = {
      schemaVersion: 'crawler-timeline/v2',
      timeline: {
        id: 'tl-1',
        title: 'Timeline',
        createdAt: '2026-09-28T12:00:00.000Z',
        updatedAt: '2026-09-28T12:00:00.000Z',
      },
      events: [{ id: 'evt-1', type: 'NarrativeEvent', note: 'compiled from raw' }],
    };

    const result = writeJsonFixtureIfChanged(targetFile, generatedData);
    assert.equal(result.written, true);

    const contentOnDisk = JSON.parse(readFileSync(targetFile, 'utf8'));
    assert.equal(contentOnDisk.events[0].note, 'compiled from raw');
    assert.equal(contentOnDisk.timeline.createdAt, '2026-01-01T00:00:00.000Z');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeJsonFixtureIfChanged handles derived floor fixtures cleanly', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'floor-1.json');

  try {
    const floorData = {
      authoringVersion: 'crawler-floor/v2',
      storyId: 'dungeon-crawler-carl',
      floor: { id: 'floor-1', ordinal: 1 },
    };

    const createResult = writeJsonFixtureIfChanged(targetFile, floorData);
    assert.equal(createResult.written, true);
    assert.equal(createResult.reason, 'created');

    const secondResult = writeJsonFixtureIfChanged(targetFile, floorData);
    assert.equal(secondResult.written, false);
    assert.equal(secondResult.reason, 'identical');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
