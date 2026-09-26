export const PLAN_PROGRESS_KEY = 'game-notes.plan-progress.v1';

const DAY_KEY = /^D(?:0[1-9]|[1-8]\d|90)$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export function emptyPlanProgress() {
  return {version: 1, startDate: '', selectedDay: 1, days: {}};
}

function calendarDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== value) return null;
  return timestamp / 86400000;
}

function validTimestamp(value) {
  return typeof value === 'string' && ISO_TIMESTAMP.test(value)
    && calendarDay(value.slice(0, 10)) !== null && Number.isFinite(Date.parse(value));
}

function normalizePlanProgress(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.version !== 1) {
    throw new Error('不支持的打卡进度格式或版本');
  }
  if (value.startDate !== '' && calendarDay(value.startDate) === null) throw new Error('计划开始日期无效');
  if (!Number.isInteger(value.selectedDay) || value.selectedDay < 1 || value.selectedDay > 90) {
    throw new Error('选中的天数须在 D01 至 D90 之间');
  }
  if (!value.days || typeof value.days !== 'object' || Array.isArray(value.days)) {
    throw new Error('每日打卡记录格式无效');
  }

  const days = {};
  for (const [key, day] of Object.entries(value.days)) {
    if (!DAY_KEY.test(key)) throw new Error(`无效的打卡日期：${key}`);
    if (!day || typeof day !== 'object' || Array.isArray(day)
      || typeof day.game !== 'boolean' || typeof day.content !== 'boolean'
      || typeof day.note !== 'string' || day.note.length > 2000
      || (day.checkedInAt !== null && !validTimestamp(day.checkedInAt))) {
      throw new Error(`${key} 的打卡记录格式无效`);
    }
    days[key] = {game: day.game, content: day.content, note: day.note, checkedInAt: day.checkedInAt};
  }
  return {version: 1, startDate: value.startDate, selectedDay: value.selectedDay, days};
}

export function parsePlanProgress(text) {
  let value;
  try { value = JSON.parse(text); }
  catch { throw new Error('文件不是有效的 JSON 打卡备份'); }
  return normalizePlanProgress(value);
}

export function serializePlanProgress(progress) {
  return JSON.stringify(normalizePlanProgress(progress), null, 2);
}

export function loadPlanProgress(storage = localStorage) {
  let raw = null;
  try {
    raw = storage.getItem(PLAN_PROGRESS_KEY);
    return {progress: raw === null ? emptyPlanProgress() : parsePlanProgress(raw), error: '', raw};
  } catch {
    return {progress: emptyPlanProgress(), error: '本地打卡进度无法读取，原数据未被覆盖。请先导出原始数据或导入有效备份。', raw};
  }
}

export function savePlanProgress(progress, storage = localStorage) {
  const normalized = normalizePlanProgress(progress);
  storage.setItem(PLAN_PROGRESS_KEY, serializePlanProgress(normalized));
  return normalized;
}

export function localToday(date = new Date()) {
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function dayForDate(startDate, today = localToday()) {
  const first = calendarDay(startDate);
  const current = calendarDay(today);
  if (first === null || current === null) return null;
  const day = current - first + 1;
  return day >= 1 && day <= 90 ? day : null;
}

export function dateForDay(startDate, number) {
  const first = calendarDay(startDate);
  if (first === null || !Number.isInteger(number) || number < 1 || number > 90) return '';
  const date = new Date((first + number - 1) * 86400000);
  return date.getUTCFullYear() <= 9999 ? date.toISOString().slice(0, 10) : '';
}
