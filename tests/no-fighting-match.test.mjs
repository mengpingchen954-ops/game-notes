import test from 'node:test';
import assert from 'node:assert/strict';
import {judgeMatch} from '../src/no-fighting/match-model.js';

const pairs = [['rule', 'witness'], ['witness', 'promise'], ['rule', 'promise']];
const routes = [['taunt', '依法定胜'], ['yield', '借势服人'], ['ritual', '以礼成局']];

test('each concession has one supported verdict; all six incomplete cases explain the missing evidence', () => {
  for (let i = 0; i < routes.length; i++) {
    const [choice, title] = routes[i];
    for (let j = 0; j < pairs.length; j++) {
      const evidence = [...pairs[j]];
      const result = judgeMatch(choice, evidence);
      assert.equal(result.settled, i === j, `${choice}: ${evidence}`);
      if (i === j) assert.equal(result.title, title);
      else {
        assert.equal(pairs[i].includes(result.missing), true);
        assert.equal(evidence.includes(result.missing), false);
        assert.match(result.copy, /补上/);
      }
      assert.deepEqual(judgeMatch(choice, [...evidence].reverse()), result, 'selection order must not change the verdict');
      assert.deepEqual(evidence, pairs[j], 'judging must not mutate the selection');
    }
  }
});

test('rejudging the same evidence does not compound rewards', () => {
  const result = judgeMatch('yield', ['witness', 'promise']);
  assert.deepEqual(result.stats, {momentum: 3, fame: 3, insight: 4});
  for (let i = 0; i < 4; i++) assert.deepEqual(judgeMatch('yield', ['witness', 'promise']), result);
});

test('a promise cannot be invented when the opponent only asked to see the rules', () => {
  const result = judgeMatch('taunt', ['promise', 'witness']);
  assert.equal(result.settled, false);
  assert.match(result.copy, /没有许诺/);
  assert.equal(result.missing, 'rule');
});

test('incomplete, duplicate and unknown submissions cannot produce a verdict', () => {
  for (const evidence of [[], ['rule'], ['rule', 'rule'], ['rule', 'unknown'], ['rule', 'witness', 'promise']]) {
    assert.throws(() => judgeMatch('yield', evidence), /两张不同/);
  }
  assert.throws(() => judgeMatch('unknown', ['rule', 'witness']), /一种话术/);
});
