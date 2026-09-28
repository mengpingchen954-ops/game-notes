import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BOXES,
  ROUTE,
  evidenceVerdict,
  opponentStickMove,
  simulateRoute,
  truthTable,
  truthVerdict
} from '../src/heavenly-exam/model.js';

test('推荐旗位让掌门沿两段直线走出边线', () => {
  const result = simulateRoute(ROUTE.recommended);
  assert.equal(result.won, true);
  assert.deepEqual(result.visitedFlags, [0, 1]);
  assert.deepEqual(result.steps.at(-1), ROUTE.exit);
  assert.ok(result.steps.length > 0);
});

test('只有一面旗时，掌门不会凭空走到出口', () => {
  assert.equal(simulateRoute([ROUTE.exit]).won, false);
});

test('被屏风挡住的旗不会被掌门看见', () => {
  const result = simulateRoute([{x: 5, y: 2}, ROUTE.exit]);
  assert.equal(result.won, false);
  assert.equal(result.reason, 'hidden');
  assert.deepEqual(result.steps, []);
});

test('甲箱是唯一满足恰有一句真话的箱子', () => {
  assert.deepEqual(truthVerdict(0), {correct: true, truth: [false, true, false]});
  assert.equal(truthVerdict(1).correct, false);
  assert.equal(truthVerdict(2).correct, false);
  assert.equal(truthTable(1).filter(Boolean).length, 2);
  assert.deepEqual(BOXES, ['甲箱', '乙箱', '丙箱']);
});

test('取子策略：七根先取一根后可以按序获胜', () => {
  let pile = 7;
  pile -= 1;
  pile -= opponentStickMove(pile);
  pile -= 2;
  pile -= opponentStickMove(pile);
  pile -= 2;
  assert.equal(pile, 0);
});

test('白算子不会取走超过剩余数量的天签', () => {
  for (let pile = 0; pile <= 7; pile++) {
    const move = opponentStickMove(pile);
    assert.ok(move >= 0 && move <= Math.min(2, pile));
  }
});

test('事实、矛盾、动机三类卷宗齐全才闭合', () => {
  const cards = [
    {id: 'fact', type: 'fact'},
    {id: 'contradiction', type: 'contradiction'},
    {id: 'motive', type: 'motive'}
  ];
  const complete = evidenceVerdict(cards, {fact: cards[0], contradiction: cards[1], motive: cards[2]});
  assert.equal(complete.complete, true);
  assert.equal(complete.matchedCount, 3);
  assert.deepEqual(complete.missing, []);
  const missingMotive = evidenceVerdict(cards.slice(0, 2), {fact: cards[0], contradiction: cards[1], motive: null});
  assert.equal(missingMotive.complete, false);
  assert.deepEqual(missingMotive.missing, ['motive']);
});
