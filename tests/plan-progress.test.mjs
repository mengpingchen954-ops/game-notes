import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PLAN_PROGRESS_KEY, emptyPlanProgress, parsePlanProgress, serializePlanProgress,
  loadPlanProgress, savePlanProgress, localToday, dayForDate, dateForDay
} from '../src/planProgress.js';

function memoryStorage(initial = null) {
  let raw = initial;
  return {
    getItem(key) { assert.equal(key, PLAN_PROGRESS_KEY); return raw; },
    setItem(key, value) { assert.equal(key, PLAN_PROGRESS_KEY); raw = value; }
  };
}

test('empty progress and populated backup round trip without losing day fields', () => {
  assert.deepEqual(emptyPlanProgress(), {version: 1, startDate: '', selectedDay: 1, days: {}});
  const progress = {version: 1, startDate: '2026-09-27', selectedDay: 90, days: {
    D01: {game: true, content: false, note: '记录一次盲测', checkedInAt: '2026-09-27T12:30:00.000Z'},
    D90: {game: true, content: true, note: '', checkedInAt: null}
  }};
  assert.deepEqual(parsePlanProgress(serializePlanProgress(progress)), progress);
  const storage = memoryStorage();
  assert.deepEqual(savePlanProgress(progress, storage), progress);
  assert.deepEqual(loadPlanProgress(storage), {progress, error: '', raw: serializePlanProgress(progress)});
});

test('missing progress returns defaults without creating storage data', () => {
  const storage = memoryStorage();
  assert.deepEqual(loadPlanProgress(storage), {progress: emptyPlanProgress(), error: '', raw: null});
});

test('parse rejects malformed, unsupported, and incomplete progress', () => {
  assert.throws(() => parsePlanProgress('{bad'), /JSON/);
  const base = emptyPlanProgress();
  const invalid = [
    {...base, version: 2}, {...base, selectedDay: 0}, {...base, selectedDay: 91},
    {...base, selectedDay: 2.5}, {...base, startDate: '2026-02-30'},
    {...base, days: []}, {...base, days: {D00: {}}}, {...base, days: {D91: {}}},
    {...base, days: {D01: {game: 'yes', content: false, note: '', checkedInAt: null}}},
    {...base, days: {D01: {game: true, content: false, note: 'x'.repeat(2001), checkedInAt: null}}},
    {...base, days: {D01: {game: true, content: false, note: '', checkedInAt: 'yesterday'}}},
    {...base, days: {D01: {game: true, content: false, note: '', checkedInAt: '2026-02-30T12:00:00Z'}}}
  ];
  for (const value of invalid) assert.throws(() => parsePlanProgress(JSON.stringify(value)));
});

test('corrupt stored data is left intact for export and does not rewrite storage', () => {
  let writes = 0;
  const storage = {getItem: () => '{bad', setItem: () => { writes++; }};
  const result = loadPlanProgress(storage);
  assert.equal(result.raw, '{bad');
  assert.ok(result.error);
  assert.deepEqual(result.progress, emptyPlanProgress());
  assert.equal(writes, 0);
});

test('save failure propagates without reporting success or replacing stored data', () => {
  const storage = {getItem: () => 'preserved', setItem: () => { throw new Error('quota'); }};
  assert.throws(() => savePlanProgress(emptyPlanProgress(), storage), /quota/);
  assert.equal(storage.getItem(), 'preserved');
});

test('dates are local calendar days and day offsets ignore daylight saving time', () => {
  const fixedInstant = new Date('2026-09-27T00:30:00.000Z');
  const previousTimezone = process.env.TZ;
  try {
    process.env.TZ = 'America/Los_Angeles';
    assert.equal(localToday(fixedInstant), '2026-09-26');
    process.env.TZ = 'Asia/Shanghai';
    assert.equal(localToday(fixedInstant), '2026-09-27');
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
  assert.equal(dayForDate('2026-03-07', '2026-03-09'), 3);
  assert.equal(dayForDate('2026-10-31', '2026-11-02'), 3);
  assert.equal(dayForDate('2026-09-27', '2026-09-26'), null);
  assert.equal(dayForDate('2026-09-27', '2026-12-25'), 90);
  assert.equal(dayForDate('2026-09-27', '2026-12-26'), null);
  assert.equal(dayForDate('', '2026-09-27'), null);
  assert.equal(dateForDay('2026-09-27', 1), '2026-09-27');
  assert.equal(dateForDay('2026-09-27', 90), '2026-12-25');
  assert.equal(dateForDay('0099-12-31', 2), '0100-01-01');
  assert.equal(dateForDay('2026-09-27', 91), '');
});
