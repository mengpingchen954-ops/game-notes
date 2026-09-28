import './full-style.css';

const $ = id => document.getElementById(id);
const state = {
  round: 0,
  momentum: 0,
  fame: 0,
  insight: 0,
  choice: null,
  evidence: []
};

const steps = [...document.querySelectorAll('.step')];
const panels = [$('round-influence'), $('round-dialogue'), $('round-verdict'), $('match-result')];
const choiceDeltas = {
  taunt: {momentum: 2, fame: -1, insight: 1, text: '掌门被激怒了，但他为了证明自己，暴露了屏风后的路线。'},
  yield: {momentum: 1, fame: 1, insight: 2, text: '掌门果然开始示范。他以为自己在教训你，其实主动交出了信息。'},
  ritual: {momentum: 1, fame: 2, insight: 0, text: '礼帖让观众先站到你这边，但掌门没有暴露太多破绽。'}
};
const evidenceDeltas = {
  rule: {momentum: 1, fame: 0, insight: 0},
  witness: {momentum: 0, fame: 2, insight: 0},
  promise: {momentum: 0, fame: 0, insight: 2}
};

function showToast(text) {
  const toast = $('toast');
  toast.textContent = text;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {toast.hidden = true;}, 2400);
}

function updateStats() {
  $('momentum').textContent = `势 ${state.momentum}`;
  $('fame').textContent = `名 ${state.fame}`;
  $('insight').textContent = `心 ${state.insight}`;
}

function setRound(round) {
  state.round = round;
  panels.forEach((panel, index) => {
    panel.hidden = index !== round;
    panel.classList.toggle('active-panel', index === round);
  });
  steps.forEach((step, index) => {
    step.classList.toggle('active', index === round);
    step.classList.toggle('done', index < round);
  });
  $('footer-line').textContent = round === 3 ? '这一局的结果，会留下下一局的线索。' : '简单操作，复杂后果。';
  window.scrollTo({top: 0, behavior: 'smooth'});
}

function createBoard() {
  const board = $('mini-board');
  for (let y = 0; y < 3; y++) for (let x = 0; x < 5; x++) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'mini-cell';
    cell.dataset.x = x;
    cell.dataset.y = y;
    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('aria-label', `${x + 1}列${y + 1}行`);
    if (x === 1 && y === 1) {cell.classList.add('start'); cell.setAttribute('aria-label', '掌门起点');}
    if (x === 3 && y !== 1) cell.classList.add('screen');
    if (x === 4 && y === 1) {cell.classList.add('exit'); cell.setAttribute('aria-label', '发亮的退场口，点击放旗');}
    cell.addEventListener('click', () => placeFlag(cell));
    board.append(cell);
  }
  const path = document.createElement('i');
  path.className = 'mini-path';
  path.setAttribute('aria-hidden', 'true');
  board.append(path);
}

function placeFlag(cell) {
  if (state.round !== 0 || cell.classList.contains('selected')) return;
  if (!cell.classList.contains('exit')) {
    $('board-status').textContent = '这一关不用研究所有格子，点击右侧发亮的退场口。';
    showToast('先点亮的退场口，才是掌门愿意赴约的地方。');
    cell.focus();
    return;
  }
  cell.classList.add('selected');
  cell.textContent = '旗';
  cell.setAttribute('aria-pressed', 'true');
  $('mini-board').classList.add('solved');
  $('board-status').textContent = '旗已放好。路线成立，可以鸣锣。';
  $('influence-next').disabled = false;
  state.momentum = 2;
  updateStats();
}

function selectChoice(button) {
  const choice = button.dataset.choice;
  state.choice = choice;
  document.querySelectorAll('#dialogue-choices button').forEach(item => {
    const selected = item === button;
    item.classList.toggle('selected', selected);
    item.setAttribute('aria-pressed', String(selected));
  });
  const delta = choiceDeltas[choice];
  state.momentum = 2 + delta.momentum;
  state.fame = delta.fame;
  state.insight = delta.insight;
  $('choice-result').textContent = delta.text;
  $('dialogue-next').disabled = false;
  updateStats();
}

function toggleEvidence(button) {
  const key = button.dataset.evidence;
  if (!state.evidence.includes(key) && state.evidence.length >= 2) {
    showToast('本回合只能带两张证据。先收回一张，再换另一张。');
    return;
  }
  if (state.evidence.includes(key)) state.evidence = state.evidence.filter(item => item !== key);
  else state.evidence = [...state.evidence, key];
  const selected = state.evidence.includes(key);
  button.classList.toggle('selected', selected);
  button.setAttribute('aria-pressed', String(selected));
  const deltas = state.evidence.reduce((total, item) => {
    const delta = evidenceDeltas[item];
    return {momentum: total.momentum + delta.momentum, fame: total.fame + delta.fame, insight: total.insight + delta.insight};
  }, {momentum: 0, fame: 0, insight: 0});
  const base = choiceDeltas[state.choice] || {momentum: 0, fame: 0, insight: 0};
  state.momentum = 2 + base.momentum + deltas.momentum;
  state.fame = base.fame + deltas.fame;
  state.insight = base.insight + deltas.insight;
  const names = {rule: '大会条款', witness: '观众证词', promise: '掌门承诺'};
  $('verdict-line').textContent = state.evidence.length ? `已提交：${state.evidence.map(item => names[item]).join(' + ')}` : '等待你提交两张证据';
  $('verdict-copy').textContent = state.evidence.includes('witness') ? '观众看见了掌门自愿赴约，裁判更愿意承认这是一场正当胜利。' : '规则能证明你“可以”这样做，但还需要一份人证让大家“愿意”相信。';
  $('verdict-next').disabled = state.evidence.length !== 2;
  updateStats();
}

function finishMatch() {
  const hasWitness = state.evidence.includes('witness');
  const hasPromise = state.evidence.includes('promise');
  const perfect = state.choice === 'yield' && hasWitness && hasPromise;
  $('result-seal').textContent = perfect ? '胜' : '成';
  $('result-title').textContent = perfect ? '借势、守礼，三方都服。' : hasWitness ? '你赢下了比赛，也赢到了一点人心。' : '规则站在你这边，但观众还在观望。';
  $('result-copy').textContent = perfect ? '你没有碰掌门一下，却让他自己走出界线、主动示范，再由观众和裁判共同确认结果。' : '这是一场有效的胜利，但还有一条更漂亮的因果链等待你下次尝试。';
  $('result-momentum').textContent = `势 ${state.momentum}`;
  $('result-fame').textContent = `名 ${state.fame}`;
  $('result-insight').textContent = `心 ${state.insight}`;
  $('result-quote').textContent = perfect ? '岳不挪：“我只是按规矩走了一步。”' : '裁判：“胜负成立，但你的说法还可以更漂亮。”';
  setRound(3);
}

function resetGame() {
  window.location.reload();
}

createBoard();
updateStats();
$('influence-next').addEventListener('click', () => setRound(1));
document.querySelectorAll('#dialogue-choices button').forEach(button => button.addEventListener('click', () => selectChoice(button)));
$('dialogue-next').addEventListener('click', () => setRound(2));
document.querySelectorAll('#evidence-list button').forEach(button => button.addEventListener('click', () => toggleEvidence(button)));
$('verdict-next').addEventListener('click', finishMatch);
$('restart').addEventListener('click', resetGame);
$('play-again').addEventListener('click', resetGame);
