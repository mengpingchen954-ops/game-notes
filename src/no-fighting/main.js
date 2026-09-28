import './style.css';
import {START, SIZE, MAX_FLAGS, canPlace, isFloor, isScreen, isExit, sameCell, simulate} from './model.js';
import {createArena, VIEW} from './scene.js';

const $ = id => document.getElementById(id);
const state = {flags: [], history: [], phase: 'loading', preview: false, hint: 0, sound: false, run: 0};
let arena;
let audioContext;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const hints = [
  '他不会拐弯找旗，但收走一面旗后，会重新看四周。第一面旗可以替第二面“带路”。',
  '屏风只挡住中间三排，上下两端都能通往退场口。先把掌门引到其中一排。',
  '可以先在掌门正上方的最上排放旗，再在同一排的退场口放旗。下面那条路也值得试试。'
];

function say(speaker, text) {$('speaker').textContent = speaker; $('dialogue').textContent = text;}
function note(text) {$('placement-note').textContent = text;}
function renderControls() {
  const running = state.phase === 'running', loading = state.phase === 'loading';
  const locked = running || loading;
  $('flag-count').textContent = `已放 ${state.flags.length} / ${MAX_FLAGS}`;
  for (let i = 0; i < MAX_FLAGS; i++) $(`flag-slot-${i}`).classList.toggle('used', i < state.flags.length);
  $('start').disabled = locked || !state.flags.length;
  $('mobile-start').disabled = locked || !state.flags.length;
  $('mobile-start').firstChild.textContent = running ? '掌门正在赴约… ' : state.flags.length ? '鸣锣，开局 ' : '先点棋盘，放下请战旗 ';
  $('mobile-start').querySelector('span').textContent = `${state.flags.length} / ${MAX_FLAGS}`;
  $('preview').disabled = locked || !state.flags.length;
  $('undo').disabled = locked || !state.history.length;
  $('reset').disabled = loading;
  $('hint').disabled = loading;
  $('preview').setAttribute('aria-pressed', String(state.preview));
  $('preview').textContent = state.preview ? '收起推演' : '推演路线';
  $('phase-label').textContent = running ? '掌门赴约中' : loading ? '布置擂台中' : state.phase === 'finished' ? '本局已结束' : state.preview ? '推演中 · 可继续改旗' : '布置中';
  for (const button of $('board-input').querySelectorAll('button')) {
    button.disabled = locked;
    const cell = {x: Number(button.dataset.x), y: Number(button.dataset.y)};
    const index = state.flags.findIndex(flag => sameCell(flag, cell));
    const name = isScreen(cell) ? '屏风，挡住视线' : sameCell(cell, START) ? '掌门起点，不能放旗' : index >= 0 ? `收回第${index + 1}面请战旗` : isExit(cell) ? '退场口，放置请战旗' : '放置请战旗';
    button.setAttribute('aria-label', `第${cell.x + 1}列第${cell.y + 1}行，${name}`);
    button.setAttribute('aria-pressed', String(index >= 0));
    button.title = button.getAttribute('aria-label');
  }
}

function backToPlanning() {
  if (state.phase === 'finished') {arena.reset(); state.phase = 'planning';}
}

function refreshBoard() {
  if (!arena) return;
  arena.setFlags(state.flags);
  const prediction = state.preview ? simulate(state.flags) : null;
  arena.setRoute(prediction);
  renderControls();
  if (prediction) {
    say('场外推演', prediction.won ? `路线走得通：${prediction.steps.length}步后出界。布置就绪，可以鸣锣了。` : prediction.steps.length ? `会走${prediction.steps.length}步，但仍留在圈内。换个旗位再看看。` : '他看不见任何一面旗。检查横排、竖列与屏风。');
  }
}

function place(cell) {
  if (!arena || state.phase === 'running' || state.phase === 'loading') return;
  if (isScreen(cell)) {note('这是屏风：挡住直线视线，也不能放旗。'); say('岳不挪', '“隔着屏风的挑战？我可没看见。”'); return;}
  if (!canPlace(cell)) {note('掌门站的位置不能放旗，请选一个空格。'); return;}
  const index = state.flags.findIndex(flag => sameCell(flag, cell));
  if (index < 0 && state.flags.length >= MAX_FLAGS) {note('两面旗都用上了。点已有的旗收回，或撤销一步。'); return;}
  backToPlanning();
  state.history.push(state.flags.map(flag => ({...flag})));
  if (index >= 0) state.flags.splice(index, 1);
  else state.flags.push({...cell});
  note(index >= 0 ? '请战旗已收回，可以换个位置。' : state.flags.length === MAX_FLAGS ? '两面旗已布好。可先推演，也可直接鸣锣。' : '第一面旗已放下。再找一个能接上路线的位置。');
  if (!state.preview) say('小杂役', state.flags.length ? '“请旗容易，请人挪步……得看位置。”' : '“掌门跑路了，这一局只能靠自己。”');
  refreshBoard();
}

function createInputs() {
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (!isFloor({x, y})) continue;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'board-cell'; button.dataset.x = x; button.dataset.y = y;
    button.style.left = `${(VIEW.left + x * VIEW.cell) / VIEW.width * 100}%`;
    button.style.top = `${(VIEW.top + y * VIEW.cell) / VIEW.height * 100}%`;
    button.style.width = `${VIEW.cell / VIEW.width * 100}%`;
    button.style.height = `${VIEW.cell / VIEW.height * 100}%`;
    button.addEventListener('click', () => place({x, y}));
    button.addEventListener('pointerenter', () => {if (state.phase !== 'running' && canPlace({x, y})) arena?.setHover({x, y});});
    button.addEventListener('pointerleave', () => arena?.setHover(null));
    button.addEventListener('focus', () => {if (canPlace({x, y})) arena?.setHover({x, y});});
    button.addEventListener('blur', () => arena?.setHover(null));
    button.addEventListener('keydown', event => {
      const direction = {ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1]}[event.key];
      if (!direction) return;
      event.preventDefault();
      const next = $('board-input').querySelector(`[data-x="${x + direction[0]}"][data-y="${y + direction[1]}"]`);
      next?.focus();
    });
    $('board-input').append(button);
  }
}

function closeResult() {
  $('result').hidden = true;
  $('board-input').inert = false;
  document.querySelector('.match-panel').inert = false;
  document.querySelector('.masthead').inert = false;
  document.querySelector('.mobile-dock').hidden = false;
}

function showResult(result) {
  $('result-stamp').textContent = result.won ? '胜' : '再';
  $('result-kicker').textContent = result.won ? '裁判落印 · 本局获胜' : '尚未出界 · 再想一招';
  $('result-title').textContent = result.won ? '借势，不必借拳。' : result.steps.length ? '人挪了，圈没出。' : '高手，纹丝不动。';
  $('result-copy').textContent = result.won ? `用了${state.flags.length}面旗，走了${result.steps.length}步。你没有碰他，只改变了他看见的局面。` : result.reason === 'hidden' ? '下一面旗不在他的直线上，或被屏风挡住。他不会自己绕路寻找。' : '旗已经收完，掌门仍在圈内。试着用另一面旗，把路线接到退场口。';
  $('result-quote').textContent = result.won ? '岳不挪：“我只是出来看看！”' : '岳不挪：“我就说，我一步都不多走。”';
  $('result-retry').firstChild.textContent = result.won ? '再试一种走法 ' : '调整旗位再来 ';
  $('result').hidden = false;
  $('board-input').inert = true;
  document.querySelector('.match-panel').inert = true;
  document.querySelector('.masthead').inert = true;
  document.querySelector('.mobile-dock').hidden = true;
  document.querySelector('.result-paper').focus({preventScroll: true});
  const paper = document.querySelector('.result-paper');
  const bounds = paper.getBoundingClientRect();
  if (bounds.top < 0 || bounds.bottom > window.innerHeight) paper.scrollIntoView({block: 'center', behavior: 'instant'});
}

function gong() {
  if (!state.sound) return;
  try {
    audioContext ??= new (window.AudioContext || window.webkitAudioContext)();
    audioContext.resume();
    const now = audioContext.currentTime;
    [145, 217, 391].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
      oscillator.type = 'sine'; oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .83, now + .7);
      gain.gain.setValueAtTime(.001, now); gain.gain.linearRampToValueAtTime(.11 / (index + 1), now + .012); gain.gain.exponentialRampToValueAtTime(.001, now + 1.1);
      oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(now); oscillator.stop(now + 1.15);
      oscillator.onended = () => {oscillator.disconnect(); gain.disconnect();};
    });
  } catch {state.sound = false; $('sound').textContent = '音效：不可用'; $('sound').setAttribute('aria-pressed', 'false');}
}

async function start() {
  if (!arena || state.phase === 'running' || !state.flags.length) return;
  closeResult();
  arena.reset();
  arena.setFlags(state.flags);
  const result = simulate(state.flags), run = ++state.run;
  state.phase = 'running'; state.preview = false;
  renderControls();
  note('掌门正在赴约。想改布置，可随时点击“重新布置”。');
  if (window.innerWidth <= 760) $('stage').scrollIntoView({block: 'start', behavior: 'instant'});
  say('裁判', '“不许动手——请！”');
  gong();
  const collected = [];
  for (const step of result.steps) {
    await arena.walkTo(step, reducedMotion.matches);
    if (run !== state.run) return;
    if (step.collected !== null) {
      collected.push(step.collected);
      arena.setFlags(state.flags, collected);
      if (!isExit(step)) say('岳不挪', '“这面旗我收了。下一位，在哪儿？”');
    }
  }
  await new Promise(resolve => setTimeout(resolve, reducedMotion.matches ? 50 : 380));
  if (run !== state.run) return;
  state.phase = 'finished';
  arena.setRoute(result);
  renderControls();
  say(result.won ? '裁判' : '岳不挪', result.won ? '“双脚出界，本局——小杂役胜！”' : '“看不见的挑战，不算挑战。”');
  note(result.won ? '这一局赢了。换一条路线，也能请他出圈。' : '可以收回旗调整位置；已经放好的旗会保留。');
  showResult(result);
}

function reset() {
  if (!arena) return;
  ++state.run;
  closeResult();
  arena.reset();
  state.flags = []; state.history = []; state.phase = 'planning'; state.preview = false;
  note('点击擂台空格放旗，再点一次收回。');
  say('岳不挪', '“堂堂掌门，还能让你两面小旗骗出圈？”');
  refreshBoard();
}

$('start').addEventListener('click', start);
$('mobile-start').addEventListener('click', start);
$('reset').addEventListener('click', reset);
$('undo').addEventListener('click', () => {
  if (!arena || state.phase === 'running' || !state.history.length) return;
  backToPlanning(); state.flags = state.history.pop();
  note('已撤销上一次放旗或收旗。');
  refreshBoard();
});
$('preview').addEventListener('click', () => {
  if (!arena || state.phase === 'running') return;
  backToPlanning(); state.preview = !state.preview;
  if (!state.preview) say('岳不挪', '“想好了没有？我可没有动手。”');
  refreshBoard();
});
$('hint').addEventListener('click', () => {
  $('hint-text').hidden = false;
  $('hint-text').textContent = hints[Math.min(state.hint, hints.length - 1)];
  state.hint = Math.min(state.hint + 1, hints.length - 1);
  $('hint').firstChild.textContent = '再听一句场外话 ';
});
$('sound').addEventListener('click', () => {
  state.sound = !state.sound;
  $('sound').setAttribute('aria-pressed', String(state.sound));
  $('sound').textContent = `音效：${state.sound ? '开' : '关'}`;
  if (state.sound) gong();
});
$('result-retry').addEventListener('click', () => {
  const won = simulate(state.flags).won;
  closeResult();
  if (won) reset();
  else {backToPlanning(); state.preview = false; refreshBoard();}
  $('board-input').querySelector('button:not(:disabled)')?.focus({preventScroll: true});
});
$('result-review').addEventListener('click', () => {closeResult(); $('reset').focus({preventScroll: true});});
document.querySelector('.result-paper').addEventListener('keydown', event => {
  if (event.key === 'Escape') {closeResult(); $('reset').focus();}
  if (event.key === 'Tab') {
    const buttons = [$('result-retry'), $('result-review')];
    if (event.shiftKey && (document.activeElement === buttons[0] || document.activeElement === event.currentTarget)) {event.preventDefault(); buttons[1].focus();}
    else if (!event.shiftKey && document.activeElement === buttons[1]) {event.preventDefault(); buttons[0].focus();}
  }
});

createInputs();
renderControls();
const game = createArena('game-canvas', scene => {
  arena = scene; state.phase = 'planning'; $('loading').hidden = true; refreshBoard();
}, message => {$('loading').textContent = message; $('loading').classList.add('error');});
window.addEventListener('pagehide', () => {audioContext?.suspend();});
// Keep Phaser's lifetime tied to this standalone page; there are no saves or external services.
window.addEventListener('beforeunload', () => game.destroy(true));
