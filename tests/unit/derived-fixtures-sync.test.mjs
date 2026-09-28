import assert from 'node:assert/strict';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { writeJsonFixtureIfChanged } from '../../scripts/sync-derived-fixtures.mjs';

test('writeJsonFixtureIfChanged suppresses timestamp-only churn and preserves byte-for-byte exact file', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'compiled-timeline.json');

  try {
    const existingRawText = '{\n  "schemaVersion": "crawler-timeline/v2",\n  "timeline": {\n    "id": "tl-1",\n    "title": "Timeline",\n    "createdAt": "2026-01-01T00:00:00.000Z",\n    "updatedAt": "2026-01-01T00:00:00.000Z"\n  },\n  "events": [\n    {\n      "id": "evt-1",\n      "type": "NarrativeEvent"\n    }\n  ]\n}\n';
    writeFileSync(targetFile, existingRawText, 'utf8');

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
    assert.equal(contentOnDisk, existingRawText);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeJsonFixtureIfChanged writes meaningful output changes, preserving createdAt and updating updatedAt', () => {
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

test('writeJsonFixtureIfChanged suppresses timestamp-only churn when existing timeline is missing createdAt, updatedAt, or both', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));

  try {
    // Case 1: Existing timeline missing createdAt (has updatedAt)
    {
      const targetFile = join(tmpDir, 'missing-created-at.json');
      const existingRawText = '{\n  "schemaVersion": "crawler-timeline/v2",\n  "timeline": {\n    "id": "tl-1",\n    "title": "Timeline",\n    "updatedAt": "2026-01-01T00:00:00.000Z"\n  },\n  "events": [\n    {\n      "id": "evt-1",\n      "type": "NarrativeEvent"\n    }\n  ]\n}\n';
      writeFileSync(targetFile, existingRawText, 'utf8');

      const generatedData = {
        schemaVersion: 'crawler-timeline/v2',
        timeline: {
          id: 'tl-1',
          title: 'Timeline',
          updatedAt: '2026-09-28T12:00:00.000Z',
        },
        events: [{ id: 'evt-1', type: 'NarrativeEvent' }],
      };

      const result = writeJsonFixtureIfChanged(targetFile, generatedData);
      assert.equal(result.written, false);
      assert.equal(result.reason, 'timestamp_only_churn');
      assert.equal(readFileSync(targetFile, 'utf8'), existingRawText);
    }

    // Case 2: Existing timeline missing updatedAt (has createdAt)
    {
      const targetFile = join(tmpDir, 'missing-updated-at.json');
      const existingRawText = '{\n  "schemaVersion": "crawler-timeline/v2",\n  "timeline": {\n    "id": "tl-1",\n    "title": "Timeline",\n    "createdAt": "2026-01-01T00:00:00.000Z"\n  },\n  "events": [\n    {\n      "id": "evt-1",\n      "type": "NarrativeEvent"\n    }\n  ]\n}\n';
      writeFileSync(targetFile, existingRawText, 'utf8');

      const generatedData = {
        schemaVersion: 'crawler-timeline/v2',
        timeline: {
          id: 'tl-1',
          title: 'Timeline',
          createdAt: '2026-09-28T12:00:00.000Z',
        },
        events: [{ id: 'evt-1', type: 'NarrativeEvent' }],
      };

      const result = writeJsonFixtureIfChanged(targetFile, generatedData);
      assert.equal(result.written, false);
      assert.equal(result.reason, 'timestamp_only_churn');
      assert.equal(readFileSync(targetFile, 'utf8'), existingRawText);
    }

    // Case 3: Existing timeline missing both createdAt and updatedAt
    {
      const targetFile = join(tmpDir, 'missing-both-timestamps.json');
      const existingRawText = '{\n  "schemaVersion": "crawler-timeline/v2",\n  "timeline": {\n    "id": "tl-1",\n    "title": "Timeline"\n  },\n  "events": [\n    {\n      "id": "evt-1",\n      "type": "NarrativeEvent"\n    }\n  ]\n}\n';
      writeFileSync(targetFile, existingRawText, 'utf8');

      const generatedData = {
        schemaVersion: 'crawler-timeline/v2',
        timeline: {
          id: 'tl-1',
          title: 'Timeline',
        },
        events: [{ id: 'evt-1', type: 'NarrativeEvent' }],
      };

      const result = writeJsonFixtureIfChanged(targetFile, generatedData);
      assert.equal(result.written, false);
      assert.equal(result.reason, 'timestamp_only_churn');
      assert.equal(readFileSync(targetFile, 'utf8'), existingRawText);
    }
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeJsonFixtureIfChanged preserves local-only edit byte-for-byte when generated output differs only by timestamps', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'compiled-timeline.json');

  try {
    const preModifiedText = '{\n  "schemaVersion": "crawler-timeline/v2",\n  "timeline": {\n    "id": "tl-1",\n    "title": "Timeline",\n    "createdAt": "2026-01-01T00:00:00.000Z",\n    "updatedAt": "2026-01-01T00:00:00.000Z"\n  },\n  "events": [\n    {\n      "id": "evt-1",\n      "type": "NarrativeEvent",\n      "customLocalNote": "uncommitted local draft"\n    }\n  ]\n}\n';
    writeFileSync(targetFile, preModifiedText, 'utf8');

    // Generated output that has the same non-timestamp content as the local edit file
    const generatedDataWithLocalEdit = {
      schemaVersion: 'crawler-timeline/v2',
      timeline: {
        id: 'tl-1',
        title: 'Timeline',
        createdAt: '2026-09-28T12:00:00.000Z',
        updatedAt: '2026-09-28T12:00:00.000Z',
      },
      events: [
        {
          id: 'evt-1',
          type: 'NarrativeEvent',
          customLocalNote: 'uncommitted local draft',
        },
      ],
    };

    const result = writeJsonFixtureIfChanged(targetFile, generatedDataWithLocalEdit);
    assert.equal(result.written, false);
    assert.equal(result.reason, 'timestamp_only_churn');

    const contentOnDisk = readFileSync(targetFile, 'utf8');
    assert.equal(contentOnDisk, preModifiedText);
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeJsonFixtureIfChanged overwrites target when generated non-timestamp content has changed', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'compiled-timeline.json');

  try {
    const preModifiedText = '{\n  "schemaVersion": "crawler-timeline/v2",\n  "timeline": {\n    "id": "tl-1",\n    "title": "Timeline",\n    "createdAt": "2026-01-01T00:00:00.000Z",\n    "updatedAt": "2026-01-01T00:00:00.000Z"\n  },\n  "events": [\n    {\n      "id": "evt-1",\n      "type": "NarrativeEvent",\n      "localDraft": true\n    }\n  ]\n}\n';
    writeFileSync(targetFile, preModifiedText, 'utf8');

    // Generated output compiled from raw floor files (does NOT contain localDraft)
    const generatedDataFromRaw = {
      schemaVersion: 'crawler-timeline/v2',
      timeline: {
        id: 'tl-1',
        title: 'Timeline',
        createdAt: '2026-09-28T12:00:00.000Z',
        updatedAt: '2026-09-28T12:00:00.000Z',
      },
      events: [{ id: 'evt-1', type: 'NarrativeEvent' }],
    };

    const result = writeJsonFixtureIfChanged(targetFile, generatedDataFromRaw);
    assert.equal(result.written, true);

    const contentOnDisk = JSON.parse(readFileSync(targetFile, 'utf8'));
    assert.equal(contentOnDisk.events[0].localDraft, undefined);
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

test('writeJsonFixtureIfChanged creates new file when destination does not exist', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'new-file.json');

  try {
    const newData = { foo: 'bar' };
    const result = writeJsonFixtureIfChanged(targetFile, newData);
    assert.equal(result.written, true);
    assert.equal(result.reason, 'created');
    assert.equal(readFileSync(targetFile, 'utf8'), '{\n  "foo": "bar"\n}\n');
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeJsonFixtureIfChanged throws SyntaxError on invalid JSON rather than overwriting', () => {
  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'corrupted.json');

  try {
    writeFileSync(targetFile, 'INVALID_JSON{', 'utf8');
    const newData = { foo: 'bar' };

    assert.throws(
      () => writeJsonFixtureIfChanged(targetFile, newData),
      (err) => err instanceof SyntaxError,
    );
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('writeJsonFixtureIfChanged lets read errors propagate rather than overwriting', () => {
  if (process.platform === 'win32' || process.getuid?.() === 0) {
    // Skip file permission test on platforms where chmod 000 is ignored
    return;
  }

  const tmpDir = mkdtempSync(join(tmpdir(), 'fixture-sync-test-'));
  const targetFile = join(tmpDir, 'unreadable.json');

  try {
    writeFileSync(targetFile, '{"foo": "bar"}', 'utf8');
    chmodSync(targetFile, 0o000);

    const newData = { foo: 'baz' };
    assert.throws(
      () => writeJsonFixtureIfChanged(targetFile, newData),
      (err) => err && (err.code === 'EACCES' || err.code === 'EPERM'),
    );
  } finally {
    chmodSync(targetFile, 0o666);
    rmSync(tmpDir, { recursive: true, force: true });
  }
});
