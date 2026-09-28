import test from 'node:test';
import assert from 'node:assert/strict';
import {START, SCREENS, EXITS, TUTORIAL_LEVEL, legalCells, canPlace, isFloor, isScreen, isExit, sameCell, visibleFrom, simulate} from '../src/no-fighting/model.js';

test('the tutorial is a one-click win at the highlighted exit', () => {
  const target = TUTORIAL_LEVEL.tutorialTarget;
  assert.equal(TUTORIAL_LEVEL.maxFlags, 1);
  assert.equal(TUTORIAL_LEVEL.screens.length, 0);
  assert.equal(canPlace(target, TUTORIAL_LEVEL), true);
  const result = simulate([target], TUTORIAL_LEVEL);
  assert.equal(result.won, true);
  assert.equal(result.steps.length, 4);
  assert.deepEqual(result.position, target);
});

test('the opponent only sees unobstructed cardinal lines', () => {
  assert.equal(visibleFrom(START, {x: 2, y: 1}), true);
  assert.equal(visibleFrom(START, {x: 5, y: 3}), false);
  assert.equal(visibleFrom(START, {x: 3, y: 2}), false);
  assert.equal(canPlace(START), false);
  assert.equal(canPlace({x: 0, y: 3}), false);
  for (const screen of SCREENS) assert.equal(canPlace(screen), false);
});

test('both routes can win and simulation never mutates the layout', () => {
  for (const y of [1, 5]) {
    const flags = [{x: 2, y}, {x: 6, y}];
    const snapshot = structuredClone(flags);
    const result = simulate(flags);
    assert.equal(result.won, true);
    assert.equal(result.steps.length, 6);
    assert.deepEqual(result.position, {x: 6, y});
    assert.deepEqual(result.visitedFlags, [0, 1]);
    assert.deepEqual(flags, snapshot);
    assert.deepEqual(simulate(flags), result);
  }
});

test('a lone flag cannot solve the level and hidden flags explain failure', () => {
  for (const cell of legalCells) assert.equal(simulate([cell]).won, false);
  assert.equal(simulate([]).reason, 'no-flags');
  const hidden = simulate([{x: 5, y: 3}, {x: 6, y: 1}]);
  assert.equal(hidden.reason, 'hidden');
  assert.equal(hidden.steps.length, 0);
  assert.equal(simulate([{x: 2, y: 1}]).reason, 'no-flags');
});

test('nearest visible flag wins, with placement order resolving distance ties', () => {
  const nearest = simulate([{x: 2, y: 1}, {x: 2, y: 2}]);
  assert.equal(nearest.visitedFlags[0], 1);
  const tied = simulate([{x: 2, y: 5}, {x: 2, y: 1}]);
  assert.equal(tied.steps[0].y, 4);
  assert.deepEqual(tied.visitedFlags, [0, 1]);
});

test('all legal two-flag layouts stay on the board and never cross a screen', () => {
  const winningExits = new Set();
  for (const a of legalCells) for (const b of legalCells) {
    if (sameCell(a, b)) continue;
    const result = simulate([a, b]);
    let previous = START;
    for (const step of result.steps) {
      assert.ok(isFloor(step));
      assert.equal(isScreen(step), false);
      assert.equal(Math.abs(previous.x - step.x) + Math.abs(previous.y - step.y), 1);
      previous = step;
    }
    assert.equal(result.won, isExit(result.position));
    if (result.won) winningExits.add(`${result.position.x},${result.position.y}`);
  }
  assert.equal(winningExits.size, EXITS.length);
});

test('invalid layouts fail explicitly', () => {
  assert.throws(() => simulate([START]));
  assert.throws(() => simulate([{x: 1, y: 1}, {x: 1, y: 1}]));
  assert.throws(() => simulate([{x: 1, y: 1}, {x: 2, y: 1}, {x: 3, y: 1}]));
});
