import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {librarySeed} from '../src/librarySeed.js';
import {libraryAttachments} from '../src/libraryAttachments.js';
import {backup,parseBackup,noteAttachments} from '../src/model.js';

test('published notes round trip and every attachment has an intact downloadable copy',()=>{
  assert.deepEqual(parseBackup(backup(librarySeed)),librarySeed);
  const ids=[];
  for(const record of librarySeed){
    for(const file of record.attachments){
      ids.push(file.id);
      const href=libraryAttachments[file.id];
      assert.ok(href?.startsWith('/game-notes/note-attachments/'),file.name);
      assert.equal(fs.statSync(new URL('../public/'+href.slice('/game-notes/'.length),import.meta.url)).size,file.size);
      assert.ok(noteAttachments(record).some(link=>link.href===href&&link.download===file.name));
    }
  }
  assert.deepEqual(Object.keys(libraryAttachments).sort(),ids.sort());
});
