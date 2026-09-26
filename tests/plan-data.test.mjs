import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parsePlan} from '../src/planData.js';

const source = readFileSync(new URL('../src/plan.md', import.meta.url), 'utf8');
const plan = parsePlan(source);

test('extracts every day in order without losing either daily task', () => {
  assert.equal(plan.weeks.length, 13);
  assert.equal(plan.days.length, 90);
  assert.deepEqual(plan.days.map(day => day.id), Array.from({length: 90}, (_, index) => `D${String(index + 1).padStart(2, '0')}`));
  for (const [index, week] of plan.weeks.entries()) {
    assert.equal(week.number, index + 1);
    assert.equal(week.days.length, index === 12 ? 6 : 7);
    assert.equal(week.days[0], plan.days[index * 7]);
    for (const day of week.days) {
      assert.equal(day.week, week.number);
      assert.ok(day.game.text && day.game.html);
      assert.ok(day.content.text && day.content.html);
    }
  }
});

test('retains the full introduction, selection questions, gates and daily record fields', () => {
  assert.match(plan.title, /90天执行计划/);
  assert.match(plan.description, /实验计划/);
  assert.match(plan.scheduleIntro, /日号是相对开始日期/);
  assert.match(plan.references.selection, /把梗图、台词和角色全部去掉/);
  assert.match(plan.references.selection, /把玩法录成15秒视频/);
  assert.match(plan.references.distribution, /两条漏斗分开记录/);
  assert.match(plan.references.distribution, /一个人的工作节奏/);
  assert.match(plan.references.distribution, /开发者向短片固定镜头/);
  assert.match(plan.references.decisions, /每个闸门如何决定/);
  assert.match(plan.references.decisions, /退款与售后分钟/);
  assert.match(plan.days[29].game.html, /<strong>闸门1：<\/strong>/);
  assert.match(plan.days[89].game.html, /<strong>闸门2：<\/strong>/);
  assert.match(plan.references.selection, /class="knowledge-table-wrap"/);
});

test('uses Markdown table tokens so escaped separators stay inside a task', () => {
  const changed = source.replace('D01 | 设每周可用工时', 'D01 | 设每周可用工时\\|预算');
  const day = parsePlan(changed).days[0];
  assert.match(day.game.text, /工时\|预算/);
  assert.match(day.content.text, /建两条独立数据表/);
});

test('escapes user-supplied HTML and fails on missing days', () => {
  const changed = source.replace('每周收集15至20个', '<script>alert(1)</script>每周收集15至20个');
  assert.match(parsePlan(changed).references.selection, /&lt;script&gt;/);
  assert.doesNotMatch(parsePlan(changed).references.selection, /<script>/);
  assert.throws(() => parsePlan(source.replace(/^\| D30 \|.*\r?\n/m, '')), /任务天数不完整/);
});
