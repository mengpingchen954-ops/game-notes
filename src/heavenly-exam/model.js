export const ROUTE = Object.freeze({
  width: 7,
  height: 5,
  start: Object.freeze({x: 1, y: 2}),
  exit: Object.freeze({x: 6, y: 0}),
  walls: Object.freeze([{x: 3, y: 1}, {x: 3, y: 2}, {x: 3, y: 3}]),
  recommended: Object.freeze([{x: 1, y: 0}, {x: 6, y: 0}])
});

export const sameCell = (a, b) => a.x === b.x && a.y === b.y;
export const wallAt = cell => ROUTE.walls.some(wall => sameCell(wall, cell));
export const inBoard = ({x, y}) => x >= 0 && x < ROUTE.width && y >= 0 && y < ROUTE.height;
export const legalFlag = cell => inBoard(cell) && !wallAt(cell) && !sameCell(cell, ROUTE.start);

function clearLine(from, to) {
  if (from.x !== to.x && from.y !== to.y) return false;
  const dx = Math.sign(to.x - from.x), dy = Math.sign(to.y - from.y);
  for (let x = from.x + dx, y = from.y + dy; x !== to.x || y !== to.y; x += dx, y += dy) {
    if (wallAt({x, y})) return false;
  }
  return true;
}

export function simulateRoute(flags) {
  if (!Array.isArray(flags) || flags.length === 0 || flags.length > 2 || flags.some(flag => !legalFlag(flag))) {
    return {won: false, reason: 'invalid', steps: [], visitedFlags: []};
  }
  const remaining = flags.map((flag, index) => ({...flag, index}));
  const steps = [];
  const visitedFlags = [];
  let position = {...ROUTE.start};
  while (remaining.length) {
    const visible = remaining.filter(flag => clearLine(position, flag)).sort((a, b) => {
      const da = Math.abs(a.x - position.x) + Math.abs(a.y - position.y);
      const db = Math.abs(b.x - position.x) + Math.abs(b.y - position.y);
      return da - db || a.index - b.index;
    });
    if (!visible.length) return {won: false, reason: 'hidden', steps, visitedFlags};
    const target = visible[0];
    const dx = Math.sign(target.x - position.x), dy = Math.sign(target.y - position.y);
    while (!sameCell(position, target)) {
      position = {x: position.x + dx, y: position.y + dy};
      steps.push({...position});
      if (sameCell(position, ROUTE.exit)) return {won: true, reason: 'out', steps, visitedFlags: [...visitedFlags, target.index]};
    }
    visitedFlags.push(target.index);
    remaining.splice(remaining.findIndex(item => item.index === target.index), 1);
  }
  return {won: sameCell(position, ROUTE.exit), reason: 'stopped', steps, visitedFlags};
}

export const TRUTH_STATEMENTS = Object.freeze([
  Object.freeze({id: 'a', speaker: '甲', text: '印在乙箱。'}),
  Object.freeze({id: 'b', speaker: '乙', text: '印不在乙箱。'}),
  Object.freeze({id: 'c', speaker: '丙', text: '印不在甲箱。'})
]);
export const BOXES = Object.freeze(['甲箱', '乙箱', '丙箱']);

export function truthTable(boxIndex) {
  return [boxIndex === 1, boxIndex !== 1, boxIndex !== 0];
}

export function truthVerdict(boxIndex) {
  if (!Number.isInteger(boxIndex) || boxIndex < 0 || boxIndex >= BOXES.length) return {correct: false, truth: []};
  const truth = truthTable(boxIndex);
  return {correct: truth.filter(Boolean).length === 1, truth};
}

export function opponentStickMove(pile) {
  if (pile <= 0) return 0;
  if (pile === 1) return 1;
  const remainder = pile % 3;
  return remainder === 1 ? 1 : remainder === 2 ? 2 : 1;
}

export function evidenceVerdict(cards, slots) {
  const selected = cards.filter(Boolean);
  const assigned = Object.values(slots).filter(Boolean);
  const types = new Set(assigned.map(card => card.type));
  const required = ['fact', 'contradiction', 'motive'];
  const missing = required.filter(type => !types.has(type));
  const complete = missing.length === 0;
  return {complete, assigned, selectedCount: selected.length, matchedCount: required.length - missing.length, missing};
}
