const freezeCells = cells => Object.freeze(cells.map(cell => Object.freeze({...cell})));

export const TUTORIAL_LEVEL = Object.freeze({
  key: 'tutorial', label: '教学局', size: 7,
  start: Object.freeze({x: 2, y: 3}), screens: freezeCells([]), exits: freezeCells([{x: 6, y: 3}]),
  maxFlags: 1, tutorialTarget: Object.freeze({x: 6, y: 3})
});
export const ADVANCED_LEVEL = Object.freeze({
  key: 'advanced', label: '进阶挑战', size: 7,
  start: Object.freeze({x: 2, y: 3}), screens: freezeCells([{x: 4, y: 2}, {x: 4, y: 3}, {x: 4, y: 4}]),
  exits: freezeCells([{x: 6, y: 1}, {x: 6, y: 5}]), maxFlags: 2
});
export const LEVELS = Object.freeze({tutorial: TUTORIAL_LEVEL, advanced: ADVANCED_LEVEL});
export const SIZE = ADVANCED_LEVEL.size;
export const START = ADVANCED_LEVEL.start;
export const SCREENS = ADVANCED_LEVEL.screens;
export const EXITS = ADVANCED_LEVEL.exits;
export const MAX_FLAGS = ADVANCED_LEVEL.maxFlags;
export const sameCell = (a, b) => a.x === b.x && a.y === b.y;
const getLevel = level => level || ADVANCED_LEVEL;
export const isExit = (cell, level) => getLevel(level).exits.some(exit => sameCell(cell, exit));
export const isScreen = (cell, level) => getLevel(level).screens.some(screen => sameCell(cell, screen));
export const isFloor = ({x, y}, level) => {
  const current = getLevel(level);
  return Number.isInteger(x) && Number.isInteger(y) && ((x >= 1 && x <= 5 && y >= 1 && y <= 5) || isExit({x, y}, current));
};
export const canPlace = (cell, level) => {
  const current = getLevel(level);
  return isFloor(cell, current) && !isScreen(cell, current) && !sameCell(cell, current.start);
};

export function visibleFrom(from, target, level) {
  const current = getLevel(level);
  if (from.x !== target.x && from.y !== target.y) return false;
  const dx = Math.sign(target.x - from.x), dy = Math.sign(target.y - from.y);
  if (!dx && !dy) return false;
  for (let x = from.x + dx, y = from.y + dy; x !== target.x || y !== target.y; x += dx, y += dy) {
    if (!isFloor({x, y}, current) || isScreen({x, y}, current)) return false;
  }
  return !isScreen(target, current) && isFloor(target, current);
}

// Pure deterministic simulation. The preview and the actual match share this exact result.
export function simulate(flags, level) {
  const current = getLevel(level);
  if (flags.length > current.maxFlags || flags.some((flag, i) => !canPlace(flag, current) || flags.slice(0, i).some(other => sameCell(flag, other)))) {
    throw new Error('请战旗位置无效');
  }
  const remaining = flags.map((flag, index) => ({...flag, index}));
  const steps = [];
  let position = {...current.start};
  const visitedFlags = [];
  while (remaining.length) {
    const visible = remaining.filter(flag => visibleFrom(position, flag, current)).sort((a, b) => {
      const da = Math.abs(a.x - position.x) + Math.abs(a.y - position.y);
      const db = Math.abs(b.x - position.x) + Math.abs(b.y - position.y);
      return da - db || a.index - b.index;
    });
    if (!visible.length) break;
    const target = visible[0];
    const dx = Math.sign(target.x - position.x), dy = Math.sign(target.y - position.y);
    while (!sameCell(position, target)) {
      position = {x: position.x + dx, y: position.y + dy};
      const collected = sameCell(position, target) ? target.index : null;
      steps.push({...position, collected});
      if (collected !== null) visitedFlags.push(collected);
      if (isExit(position, current)) return {won: true, steps, position, visitedFlags, reason: 'out'};
    }
    remaining.splice(remaining.findIndex(flag => flag.index === target.index), 1);
  }
  return {won: false, steps, position, visitedFlags, reason: remaining.length ? 'hidden' : 'no-flags'};
}

export const legalCells = Array.from({length: SIZE * SIZE}, (_, index) => ({x: index % SIZE, y: Math.floor(index / SIZE)})).filter(cell => canPlace(cell, ADVANCED_LEVEL));
export const tutorialLegalCells = Array.from({length: TUTORIAL_LEVEL.size * TUTORIAL_LEVEL.size}, (_, index) => ({x: index % TUTORIAL_LEVEL.size, y: Math.floor(index / TUTORIAL_LEVEL.size)})).filter(cell => canPlace(cell, TUTORIAL_LEVEL));
