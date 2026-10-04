import { expect, test, type Page } from '@playwright/test';
import { compiledTimeline } from '../../app/domain/fixtures/compiled-timeline.ts';
import { getNarrativePresentation } from '../../app/domain/narrative-presentation.ts';
import { openReplayContext, enterReplayByScrubbing } from '../helpers/replay';

interface TestTimelineEvent {
  sequence: number;
  type: string;
  kind?: string;
  summary: string;
  occurred_at?: string;
  position?: {
    floor?: number;
    elapsedSeconds?: number;
  };
}

const events = compiledTimeline.events as unknown as TestTimelineEvent[];

function narrativeEvents(kind: string, floor?: number) {
  return events
    .filter((event) =>
      event.type === 'NarrativeEvent' &&
      event.kind === kind &&
      (floor === undefined || event.position?.floor === floor)
    )
    .sort((a, b) => a.sequence - b.sequence);
}

function requireNarrative(kind: string, floor?: number) {
  const event = narrativeEvents(kind, floor)[0];
  if (!event) throw new Error(`Missing ${kind} narrative${floor ? ` on Floor ${floor}` : ''}.`);
  return event;
}

async function selectSequence(page: Page, sequence: number) {
  const slider = page.getByRole('slider', { name: 'Selected timeline sequence' });
  await slider.fill(String(sequence));
  await expect(slider).toHaveValue(String(sequence));
}

function logEntryFor(page: Page, event: TestTimelineEvent) {
  return page.locator('article.typed-log-entry').filter({ hasText: event.summary });
}

async function openFloorRules(page: Page) {
  await openReplayContext(page);
  await page.getByRole('button', { name: '📜 FLOOR RULES', exact: true }).click();
}

async function openTimelineHistory(page: Page) {
  await openReplayContext(page);
  await page.getByRole('button', { name: '📜 HISTORY', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/crawler-command-interface/');
  await enterReplayByScrubbing(page);
});

test('rule history changes at two scrub positions without hard-coded directives', async ({ page }) => {
  const rules = narrativeEvents('rule-changed', 1);
  expect(rules.length).toBeGreaterThanOrEqual(2);
  const firstRule = rules[0];
  const secondRule = rules[1];

  await selectSequence(page, firstRule.sequence);
  await openFloorRules(page);

  await expect(page.getByText(firstRule.summary, { exact: true })).toBeVisible();
  await expect(page.getByText(secondRule.summary, { exact: true })).toHaveCount(0);
  await expect(page.getByText(/HISTORICAL CHANGE LOG/)).toBeVisible();

  await page.keyboard.press('Escape');
  await page.getByRole('slider', { name: 'Selected timeline sequence' }).fill(String(secondRule.sequence));
  await openFloorRules(page);
  await expect(page.getByText(secondRule.summary, { exact: true })).toBeVisible();
});

test('episode, collapse, and encounter resolution render as typed timeline markers', async ({ page }) => {
  const episode = requireNarrative('episode-released');
  const collapse = requireNarrative('floor-collapsed');
  const encounter = requireNarrative('encounter-resolved');

  const maxSeq = Math.max(episode.sequence, collapse.sequence, encounter.sequence);
  await selectSequence(page, maxSeq);
  await openTimelineHistory(page);

  const episodeMarker = logEntryFor(page, episode);
  await expect(episodeMarker).toBeVisible();

  const collapseMarker = logEntryFor(page, collapse);
  await expect(collapseMarker).toHaveClass(/terminal/);

  const encounterMarker = logEntryFor(page, encounter);
  await expect(encounterMarker).toBeVisible();

  await episodeMarker.click();
  const slider = page.getByRole('slider', { name: 'Selected timeline sequence' });
  await expect(slider).toHaveValue(String(episode.sequence));
});

test('unanchored Floor 2 story event never displays an inherited or undefined time', async ({ page }) => {
  const unanchored = events.find((event) =>
    event.type === 'NarrativeEvent' &&
    event.position?.floor === 2 &&
    event.occurred_at === undefined &&
    event.position?.elapsedSeconds === undefined &&
    ['encounter-resolved', 'other', 'floor-exited'].includes(event.kind ?? '')
  );
  if (!unanchored) throw new Error('Missing an unanchored Floor 2 narrative event.');

  await selectSequence(page, unanchored.sequence);
  await openTimelineHistory(page);

  const entry = logEntryFor(page, unanchored);
  await expect(entry).toBeVisible();
  await expect(entry).toContainText('exact time not sourced');
  await expect(entry).not.toContainText('undefined');
});

test('floor-scoped LOG never reclassifies a prior-floor narrative as a generic event', async ({ page }) => {
  const floor1Narrative = requireNarrative('rule-changed', 1);
  const floor2FirstSequence = Math.min(
    ...events.filter((event) => event.position?.floor === 2).map((event) => event.sequence),
  );

  await selectSequence(page, floor2FirstSequence);
  await openReplayContext(page);
  const floorSelect = page.getByRole('combobox', { name: 'Select floor context' });
  await floorSelect.selectOption('2');
  await page.getByRole('button', { name: 'Close timeline controls' }).click();

  await openTimelineHistory(page);

  const genericFallback = page.locator('details').filter({ hasText: 'GENERIC SYSTEM EVENTS' });
  await expect(genericFallback).not.toContainText(floor1Narrative.summary);
  await expect(page.getByText(floor1Narrative.summary, { exact: true })).toHaveCount(0);
});
