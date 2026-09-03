import { readFileSync, writeFileSync } from 'node:fs';

function update(path, transform) {
  const content = readFileSync(path, 'utf8');
  const next = transform(content);
  if (next === content) throw new Error(`No migration changes made to ${path}`);
  writeFileSync(path, next);
}

update('tests/countdowns.test.mjs', (content) => content
  .replace('{ anchorOrder: 1, remainingSeconds: 100,', '{ anchorEventId: "e1", remainingSeconds: 100,')
  .replace('{ anchorOrder: 2, remainingSeconds: 500000,', '{ anchorEventId: "e2", remainingSeconds: 500000,')
  .replace('{ anchorOrder: 3, remainingSeconds: 400000,', '{ anchorEventId: "e3", remainingSeconds: 400000,')
  .replace('err.includes("increases from 100s at order #1 to 500000s at order #2")', 'err.includes(\'increases from 100s at event "e1" to 500000s at event "e2"\')')
  .replace('err.includes("increases from 500000s at order #2 to 600000s at order #3")', 'err.includes(\'increases from 500000s at event "e2" to 600000s at event "e3"\')'));

update('tests/raw-floor-adapter.test.mjs', (content) => content
  .replace('duplicate anchor order', 'duplicate anchor event ID')
  .replace(/^\s*(?:let|const) nextOrder = rawDoc\.events\.length \+ 1;\n/gm, '')
  .replace(/^\s*order: nextOrder\+\+,\n/gm, '')
  .replace(/^\s*order: nextOrder,\n/gm, '')
  .replace(/^\s*order: resetEvent\.order,\n/gm, '')
  .replace(/^\s*order: phaseBreakDoc\.events\[1\]\.order,\n/gm, '')
  .replace(
    'eventId: crossFloorDoc.events[crossFloorDoc.events.length - 1].id,',
    'eventId: crossFloorDoc.events[crossFloorDoc.events.length - 2].id,',
  )
  .replace(
    'const targetBetweenFloors = crossFloorDoc.events[crossFloorDoc.events.length - 1].sequence;',
    'const targetBetweenFloors = compiledCrossFloor.events.find((event) => event.id === crossFloorDoc.events[crossFloorDoc.events.length - 1].id).sequence;',
  )
  .replace(
    'projectObservationValue(compiledCrossFloor, targetBetweenFloors + 1, "crawler-condition.currentHealth")',
    'projectObservationValue(compiledCrossFloor, targetBetweenFloors, "crawler-condition.currentHealth")',
  )
  .replace(
    'const manaInterp = projectObservationValue(compiledPhaseBreak, phaseBreakDoc.events[1].sequence, "crawler-condition.currentMana");',
    'const phaseBreakSequence = compiledPhaseBreak.events.find((event) => event.id === phaseBreakDoc.events[1].id).sequence;\n  const manaInterp = projectObservationValue(compiledPhaseBreak, phaseBreakSequence, "crawler-condition.currentMana");',
  ));

console.log('Updated countdown anchor tests and removed generated order/sequence assumptions from raw test events.');
