import test from 'node:test';
import assert from 'node:assert/strict';
import {backup,blankRecord,completion,mergeRecords,normalizeRecord,parseBackup,seed,markdown} from '../src/model.js';

test('seed completes all eight framework questions',()=>{assert.equal(completion(seed),8);});
test('backup round trips normalized records',()=>{const parsed=parseBackup(backup([seed]));assert.equal(parsed.length,1);assert.deepEqual(parsed[0],normalizeRecord(seed));});
test('invalid and duplicate backups are rejected',()=>{
 assert.throws(()=>parseBackup('{bad'),/JSON/);
 assert.throws(()=>parseBackup(JSON.stringify({version:2,records:[]})),/版本/);
 assert.throws(()=>parseBackup(JSON.stringify({version:1,records:[seed,seed]})),/重复/);
});
test('merge skips identical records and forks changed id conflicts',()=>{
 const identical=mergeRecords([seed],[seed],()=> 'copy-id');assert.equal(identical.skipped,1);assert.equal(identical.records.length,1);
 const changed={...seed,summary:'changed'};const result=mergeRecords([seed],[changed],()=> 'copy-id');assert.equal(result.added,1);assert.equal(result.records[1].id,'copy-id');
});
test('markdown contains framework and notes',()=>{const text=markdown(seed);assert.match(text,/核心赌局/);assert.match(text,/下一枪打自己/);assert.match(text,/游玩笔记/);});
test('note records round trip with note markdown and legacy compatibility',()=>{
  const note={...blankRecord('note'),title:'可控的随机性',summary:'公开一部分结果，留下可推断的未知。',notes:'记录一次机制观察。',tags:['随机性']};
  const parsed=parseBackup(backup([note]))[0];
  assert.equal(parsed.kind,'note');
  assert.deepEqual(parsed,note);
  const legacy={...seed};delete legacy.kind;
  assert.equal(parseBackup(backup([legacy]))[0].kind,'analysis');
  assert.equal(mergeRecords([seed],[legacy]).skipped,1);
  assert.throws(()=>normalizeRecord({...note,kind:'unknown'}));
  assert.doesNotMatch(markdown(parsed),/核心玩法|待填写/);
  assert.match(markdown(parsed),/## 灵感内容/);
});
