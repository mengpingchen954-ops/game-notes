import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const plan = readFileSync(new URL('../src/plan.md', import.meta.url), 'utf8');
const dayNumbers = text => [...text.matchAll(/^\| D(\d{2}) \|/gm)].map(match => Number(match[1]));

test('the plan covers D01 through D90 exactly once and in order', () => {
  assert.deepEqual(dayNumbers(plan), Array.from({length: 90}, (_, index) => index + 1));
});

test('the plan preserves both selection questions and decision gates', () => {
  assert.match(plan, /把梗图、台词和角色全部去掉，这游戏还想让人再玩一局吗？/);
  assert.match(plan, /把玩法录成15秒视频，观众能看懂那个情绪笑点吗？/);
  assert.match(plan, /^\| D30 \| \*\*闸门1：\*\*/m);
  assert.match(plan, /^\| D90 \| \*\*闸门2：\*\*/m);
});

test('the plan has twelve complete weeks and a final six-day section', () => {
  const dailyPlan = plan.split('## 六、每个闸门如何决定')[0];
  const weeks = [...dailyPlan.matchAll(/^### (第(\d+)周|最后6天)：.*$/gm)];
  assert.deepEqual(weeks.map(match => match[2] ? Number(match[2]) : '最后6天'), [
    ...Array.from({length: 12}, (_, index) => index + 1),
    '最后6天'
  ]);

  for (const [index, week] of weeks.entries()) {
    const section = dailyPlan.slice(week.index, weeks[index + 1]?.index);
    const count = index === 12 ? 6 : 7;
    assert.deepEqual(dayNumbers(section), Array.from({length: count}, (_, day) => index * 7 + day + 1), week[1]);
  }
});
