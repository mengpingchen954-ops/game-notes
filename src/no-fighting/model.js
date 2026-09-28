export const SIZE = 7;
export const START = Object.freeze({x: 2, y: 3});
export const SCREENS = Object.freeze([{x: 4, y: 2}, {x: 4, y: 3}, {x: 4, y: 4}].map(Object.freeze));
export const EXITS = Object.freeze([{x: 6, y: 1}, {x: 6, y: 5}].map(Object.freeze));
export const MAX_FLAGS = 2;
export const sameCell = (a, b) => a.x === b.x && a.y === b.y;
export const isExit = cell => EXITS.some(exit => sameCell(cell, exit));
export const isScreen = cell => SCREENS.some(screen => sameCell(cell, screen));
export const isFloor = ({x, y}) => Number.isInteger(x) && Number.isInteger(y) && ((x >= 1 && x <= 5 && y >= 1 && y <= 5) || isExit({x, y}));
export const canPlace = cell => isFloor(cell) && !isScreen(cell) && !sameCell(cell, START);

export function visibleFrom(from, target) {
  if (from.x !== target.x && from.y !== target.y) return false;
  const dx = Math.sign(target.x - from.x), dy = Math.sign(target.y - from.y);
  if (!dx && !dy) return false;
  for (let x = from.x + dx, y = from.y + dy; x !== target.x || y !== target.y; x += dx, y += dy) {
    if (!isFloor({x, y}) || isScreen({x, y})) return false;
  }
  return !isScreen(target) && isFloor(target);
}

// Pure deterministic simulation. The preview and the actual match share this exact result.
export function simulate(flags) {
  if (flags.length > MAX_FLAGS || flags.some((flag, i) => !canPlace(flag) || flags.slice(0, i).some(other => sameCell(flag, other)))) {
    throw new Error('请战旗位置无效');
  }
  const remaining = flags.map((flag, index) => ({...flag, index}));
  const steps = [];
  let position = {...START};
  const visitedFlags = [];
  while (remaining.length) {
    const visible = remaining.filter(flag => visibleFrom(position, flag)).sort((a, b) => {
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
      if (isExit(position)) return {won: true, steps, position, visitedFlags, reason: 'out'};
    }
    remaining.splice(remaining.findIndex(flag => flag.index === target.index), 1);
  }
  return {won: false, steps, position, visitedFlags, reason: remaining.length ? 'hidden' : 'no-flags'};
}

export const legalCells = Array.from({length: SIZE * SIZE}, (_, index) => ({x: index % SIZE, y: Math.floor(index / SIZE)})).filter(canPlace);
