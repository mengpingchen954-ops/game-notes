import './match-style.css';
import {TUTORIAL_LEVEL, simulate, isFloor, sameCell} from './model.js';
import {ARGUMENTS, EVIDENCE, judgeMatch} from './match-model.js';

const $ = id => document.getElementById(id);
const championUrl = new URL('./assets/champion.svg', import.meta.url).href;
const state = {round: 0, flagPlaced: false, running: false, choice: null, evidence: [], momentum: 0, fame: 0, insight: 0};
const collectionKey = 'no-fighting-match-seals-v1';
let collection = [];
try {
  const saved = JSON.parse(localStorage.getItem(collectionKey) || '[]');
  if (Array.isArray(saved)) collection = [...new Set(saved.filter(key => Object.hasOwn(ARGUMENTS, key)))];
} catch { /* Matches remain playable if storage is unavailable. */ }
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

function updateStats() {
  for (const [key, label] of [['momentum', '势'], ['fame', '名'], ['insight', '心']]) $(key).textContent = `${label} ${state[key]}`;
}
function toast(text) {
  $('toast').textContent = text;
  $('toast').hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {$('toast').hidden = true;}, 4000);
}
function setRound(round) {
  state.round = round;
  const active = $(['board-scene', 'duel-scene', 'verdict-scene', 'result-scene'][round]);
  document.querySelectorAll('.match-scene').forEach(scene => {scene.hidden = scene !== active;});
  document.querySelectorAll('.round-step').forEach((step, index) => {
    step.classList.toggle('active', index === round);
    step.classList.toggle('done', index < round);
    if (index === round) step.setAttribute('aria-current', 'step'); else step.removeAttribute('aria-current');
  });
  $('footer-line').textContent = round === 3 ? '同一场出圈，可以赢出不同的道理。' : '看清局势，再借一分力。';
  $('toast').hidden = true;
  active.focus({preventScroll: true});
  window.scrollTo({top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
}
function moveChampion({x, y}) {
  $('champion').style.left = `${7 + (x + .5) * 86 / 7}%`;
  $('champion').style.top = `${8 + (y + .5) * 84 / 7}%`;
}
function createBoard() {
  for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
    const position = {x, y};
    const floor = isFloor(position, TUTORIAL_LEVEL);
    const cell = document.createElement(floor ? 'button' : 'span');
    cell.className = `board-cell${floor ? '' : ' void'}`;
    if (floor) {
      cell.type = 'button';
      const target = sameCell(position, TUTORIAL_LEVEL.tutorialTarget);
      cell.setAttribute('aria-label', target ? '退场口，点击放置请战旗' : sameCell(position, TUTORIAL_LEVEL.start) ? '掌门起点' : `${x}列${y}行，擂台`);
      if (target) {cell.classList.add('exit'); cell.setAttribute('aria-pressed', 'false'); cell.addEventListener('click', placeFlag);}
      else cell.addEventListener('click', () => toast('开场不用猜：点右侧亮起的退场口，放下一面请战旗。'));
    } else cell.setAttribute('aria-hidden', 'true');
    $('board-grid').append(cell);
  }
  $('champion').src = championUrl;
  $('duel-champion').src = championUrl;
  moveChampion(TUTORIAL_LEVEL.start);
  for (const key of ['rule', 'witness']) document.querySelector(`[data-evidence="${key}"] span`).textContent = EVIDENCE[key].copy;
}
function placeFlag(event) {
  if (state.round !== 0 || state.flagPlaced) return;
  event.currentTarget.classList.add('selected');
  event.currentTarget.setAttribute('aria-pressed', 'true');
  state.flagPlaced = true;
  $('board-status').textContent = '请战旗已放好，准备鸣锣。';
  $('board-start').disabled = false;
  state.momentum = 1;
  updateStats();
}
async function startBoard() {
  if (!state.flagPlaced || state.running) return;
  state.running = true;
  $('board-start').disabled = true;
  $('board-status').textContent = '岳不挪：“站在那儿等我！”';
  const result = simulate([TUTORIAL_LEVEL.tutorialTarget], TUTORIAL_LEVEL);
  $('route-line').classList.add('visible');
  $('champion').classList.add('moving');
  for (const step of result.steps) {moveChampion(step); await pause(reducedMotion.matches ? 80 : 340);}
  $('champion').classList.remove('moving');
  state.momentum = 2;
  $('board-status').textContent = '掌门出界！他还不服，转身要求理论。';
  $('board-caption').textContent = '观众：“看见了！是他自己走出去的！” · 获得观众证词';
  updateStats();
  await pause(1100);
  setRound(1);
  state.running = false;
}
function chooseDuel(button) {
  if (state.choice) return;
  state.choice = button.dataset.choice;
  const argument = ARGUMENTS[state.choice];
  document.querySelectorAll('#duel-choices button').forEach(item => {
    item.classList.toggle('selected', item === button);
    item.setAttribute('aria-pressed', String(item === button));
    item.disabled = true;
  });
  $('speech-bubble').textContent = argument.speech;
  $('duel-feedback').textContent = argument.feedback;
  $('character-state').textContent = argument.mood;
  $('duel-champion').classList.add('reacting');
  $('duel-next').disabled = false;
  state.momentum = 2 + argument.momentum;
  state.fame = argument.fame;
  state.insight = argument.insight;
  updateStats();
}
function submitDuel() {
  if (!state.choice) return;
  $('judge-question').textContent = {taunt: '“插旗合法吗？又是谁让他出的圈？”', yield: '“他答应了什么？有没有人看见？”', ritual: '“他答应服判的条件，满足了吗？”'}[state.choice];
  $('promise-copy').textContent = ARGUMENTS[state.choice].promise;
  $('evidence-reminder').textContent = ARGUMENTS[state.choice].speech;
  setRound(2);
}
function chooseEvidence(button) {
  const key = button.dataset.evidence;
  if (!state.evidence.includes(key) && state.evidence.length >= 2) {toast('最多提交两张。再点已选的证据可以收回。'); return;}
  state.evidence = state.evidence.includes(key) ? state.evidence.filter(item => item !== key) : [...state.evidence, key];
  const selected = state.evidence.includes(key);
  button.classList.toggle('selected', selected);
  button.setAttribute('aria-pressed', String(selected));
  $('evidence-feedback').textContent = state.evidence.length === 2 ? '已选 2 张。它们回应了掌门的条件吗？可以递交裁判。' : `已选 ${state.evidence.length} / 2 张 · 再点一次可以收回。`;
  $('verdict-submit').disabled = state.evidence.length !== 2;
}
function renderCollection() {
  $('collection').replaceChildren(...Object.entries(ARGUMENTS).map(([key, argument]) => {
    const stamp = document.createElement('span');
    stamp.className = collection.includes(key) ? 'earned' : '';
    stamp.textContent = `${collection.includes(key) ? '已获' : '未获'} · ${argument.title}`;
    return stamp;
  }));
  $('collection-note').textContent = `本机胜印 ${collection.length} / 3 · 换种话术，试试另一种赢法`;
}
function submitVerdict() {
  if (state.evidence.length !== 2) return;
  const result = judgeMatch(state.choice, state.evidence);
  Object.assign(state, result.stats);
  updateStats();
  if (result.settled && !collection.includes(state.choice)) {
    collection.push(state.choice);
    try {localStorage.setItem(collectionKey, JSON.stringify(collection));} catch { /* Optional persistence. */ }
  }
  $('result-seal').textContent = result.settled ? '胜' : '待';
  $('result-title').textContent = result.title;
  $('result-copy').textContent = result.copy;
  $('result-quote').textContent = result.quote;
  $('result-thought').textContent = result.settled ? result.thought : '不用重走擂台，换一张证据就能继续。';
  $('result-label').textContent = result.settled ? '裁判落印 · 本场获胜' : '暂缓落印 · 允许补证';
  $('retry-evidence').hidden = result.settled;
  renderCollection();
  setRound(3);
}
function replayDebate() {
  Object.assign(state, {choice: null, evidence: [], momentum: 2, fame: 0, insight: 0});
  document.querySelectorAll('#duel-choices button, #evidence-cards button').forEach(button => {
    button.classList.remove('selected'); button.setAttribute('aria-pressed', 'false'); button.disabled = false;
  });
  $('duel-champion').classList.remove('reacting');
  $('speech-bubble').textContent = '“停！老夫只是应邀下台，怎么就算输了？你得给我个说法！”';
  $('duel-feedback').textContent = '只能说一句。想好要他承认什么，再开口。';
  $('character-state').textContent = '不服气 · 等你开口';
  $('duel-next').disabled = true;
  $('verdict-submit').disabled = true;
  $('evidence-feedback').textContent = '请选择两张证据。';
  updateStats(); setRound(1);
}

createBoard(); updateStats();
$('board-start').addEventListener('click', startBoard);
$('board-hint').addEventListener('click', () => toast('他只沿直线回应请战旗。旗放在同一横排的出口，他就会自己走出界。'));
document.querySelectorAll('#duel-choices button').forEach(button => button.addEventListener('click', () => chooseDuel(button)));
$('duel-next').addEventListener('click', submitDuel);
document.querySelectorAll('#evidence-cards button').forEach(button => button.addEventListener('click', () => chooseEvidence(button)));
$('verdict-submit').addEventListener('click', submitVerdict);
$('restart').addEventListener('click', () => window.location.reload());
$('play-again').addEventListener('click', replayDebate);
$('retry-evidence').addEventListener('click', () => setRound(2));
