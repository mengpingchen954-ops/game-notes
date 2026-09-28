import test from 'node:test';
import assert from 'node:assert/strict';
import {hotspotGroups, hotspotTopics, topicForKey, topicsForGroup} from '../src/hotspotData.js';

test('hotspot lab is divided into five groups, with a standalone heavenly exam module', () => {
  assert.deepEqual(hotspotGroups.map(group => group.key), ['selection', 'translation', 'validation', 'production', 'philosophy']);
  assert.equal(hotspotTopics.length, 16);
  assert.equal(new Set(hotspotTopics.map(topic => topic.key)).size, hotspotTopics.length);
  for (const group of hotspotGroups) {
    const topics = topicsForGroup(group.key);
    assert.equal(topics.length, group.key === 'philosophy' ? 4 : 3);
    assert.ok(group.title && group.description);
    for (const topic of topics) {
      assert.equal(topicForKey(topic.key), topic);
      assert.ok(topic.title && topic.summary && topic.tags.length > 0);
      assert.ok(topic.sections.length > 0 && topic.checklist.length > 0);
    }
  }
  const plan = topicForKey('heavenly-exam-plan');
  assert.equal(plan.label, '天庭考核主策划');
  assert.match(JSON.stringify(plan), /封神榜缺页案/);
  assert.match(JSON.stringify(plan), /公开听证/);
});

test('tables are structurally complete and the lab covers the agreed evidence chain', () => {
  for (const topic of hotspotTopics) {
    for (const section of topic.sections) {
      if (!section.table) continue;
      for (const row of section.table.rows) assert.equal(row.length, section.table.columns.length, `${topic.key}/${section.title}`);
    }
  }
  const text = JSON.stringify(hotspotTopics);
  for (const phrase of ['把梗图、台词和角色全部去掉', '15秒', 'Cocos', '2D', '3D', '试玩广告', '实时抓取', '版权', '课程']) {
    assert.match(text, new RegExp(phrase));
  }
  assert.match(text, /点赞高只是进入下一轮的信号/);
  assert.match(text, /不能推出完整游戏长期留存/);
});
