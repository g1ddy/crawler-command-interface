import { expect, test, type Page } from '@playwright/test';
import { compiledTimeline } from '../../app/domain/fixtures/compiled-timeline.ts';
import { getNarrativePresentation } from '../../app/domain/narrative-presentation.ts';

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
  await page.getByRole('combobox', { name: 'Floor timeline scope' }).selectOption('all');
  await page.getByRole('slider', { name: 'Selected timeline sequence' }).fill(String(sequence));
  await expect(page.getByRole('heading', { name: new RegExp(`SEQ #${sequence}\\b`) })).toBeVisible();
}

function markerFor(page: Page, event: TestTimelineEvent) {
  const presentation = getNarrativePresentation(event.kind);
  return page.getByRole('button', {
    name: `${presentation.accessibleLabel}: ${event.summary}`,
    exact: true,
  });
}

async function openFloorRules(page: Page) {
  await page.getByRole('button', { name: '📜 FLOOR RULES', exact: true }).click();
}

async function openTimelineHistory(page: Page) {
  await page.getByRole('button', { name: '📜 HISTORY', exact: true }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto('/crawler-command-interface/');
  await expect(page.getByText('FLOOR NAVIGATOR:')).toBeVisible();
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

  await page.getByRole('slider', { name: 'Selected timeline sequence' }).fill(String(secondRule.sequence));
  await expect(page.getByText(secondRule.summary, { exact: true })).toBeVisible();
});

test('episode, collapse, and encounter resolution render as typed timeline markers', async ({ page }) => {
  const episode = requireNarrative('episode-released');
  const collapse = requireNarrative('floor-collapsed');
  const encounter = requireNarrative('encounter-resolved');

  // The application opens on the latest floor. These assertions intentionally
  // span floors, so establish Whole Story scope before locating any marker.
  await page.getByRole('combobox', { name: 'Floor timeline scope' }).selectOption('all');

  const episodeMarker = markerFor(page, episode);
  await expect(episodeMarker).toBeVisible();
  await episodeMarker.focus();
  await episodeMarker.press('Enter');
  await expect(page.getByRole('heading', { name: new RegExp(`SEQ #${episode.sequence}\\b`) })).toBeVisible();

  const collapseMarker = markerFor(page, collapse);
  await expect(collapseMarker).toHaveClass(/terminal/);
  await collapseMarker.focus();
  await collapseMarker.press('Enter');
  await expect(page.getByRole('heading', { name: new RegExp(`SEQ #${collapse.sequence}\\b`) })).toBeVisible();

  const encounterMarker = markerFor(page, encounter);
  await expect(encounterMarker).toBeVisible();
  await encounterMarker.focus();
  await encounterMarker.press('Enter');
  await expect(page.getByRole('heading', { name: new RegExp(`SEQ #${encounter.sequence}\\b`) })).toBeVisible();
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

  await expect(page.locator('.replay-banner')).toContainText('exact time not sourced');
  await expect(page.getByRole('heading', { name: new RegExp(`SEQ #${unanchored.sequence}\\b`) })).toContainText('exact time not sourced');

  await page.getByRole('button', { name: /REPLAY DIAGNOSTICS/ }).click();
  const marker = markerFor(page, unanchored);
  await marker.hover();
  const preview = page.locator('.event-card-preview');
  await expect(preview).toContainText('exact time not sourced');
  await expect(preview).not.toContainText('undefined');
});

test('floor-scoped LOG never reclassifies a prior-floor narrative as a generic event', async ({ page }) => {
  const floor1Narrative = requireNarrative('rule-changed', 1);
  const floor2FirstSequence = Math.min(
    ...events.filter((event) => event.position?.floor === 2).map((event) => event.sequence),
  );

  const floorSelector = page.getByRole('combobox', { name: 'Floor timeline scope' });
  await floorSelector.selectOption('2');
  await page.getByRole('slider', { name: 'Selected timeline sequence' }).fill(String(floor2FirstSequence));
  await openTimelineHistory(page);

  const genericFallback = page.locator('details').filter({ hasText: 'GENERIC SYSTEM EVENTS' });
  await expect(genericFallback).not.toContainText(floor1Narrative.summary);
  await expect(page.getByText(floor1Narrative.summary, { exact: true })).toHaveCount(0);
});
