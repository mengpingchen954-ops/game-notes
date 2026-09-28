import './style.css';
import {BOXES, ROUTE, TRUTH_STATEMENTS, evidenceVerdict, opponentStickMove, simulateRoute, truthVerdict, wallAt} from './model.js';

let actionEpoch = 0;
const SAVE_KEY = 'heavenly-exam-v1';
const $ = id => document.getElementById(id);

const EXAMS = [
  {
    id: 'route', number: '一', department: '南天门秩序司', title: '武德与借势科', subtitle: '请君出圈', examiner: '岳不挪', badge: '顺势印',
    intro: '不碰掌门，只让他自己走出边线。',
    hint: '掌门只看同一行或同一列的旗。先在他正上方放旗，再让第二面旗接上出口。',
    evidence: [
      {id: 'route-fact', type: 'fact', label: '事实 · 现场物证', title: '封神榜残角落在门外', text: '岳不挪出圈时，袖中掉出封神榜残角。背面有昨夜子时的南天门出入章，编号天字七号。'},
      {id: 'route-contradiction', type: 'contradiction', label: '矛盾 · 门卫口供', title: '他说子时无人出入', text: '岳不挪说昨夜子时无人出入；袖中残角上的子时出入章却表明有一份名册经过南天门。'}
    ]
  },
  {
    id: 'truth', number: '二', department: '判官事实司', title: '事实与口供科', subtitle: '谁在说真话', examiner: '判官', badge: '明辨印',
    intro: '三句话里恰有一句为真。找到封印所在的箱子。',
    hint: '先假设印在甲、乙、丙三个箱子里，分别数三句话有几句为真。',
    evidence: [
      {id: 'truth-fact', type: 'fact', label: '事实 · 封印副本', title: '甲箱藏着子时用印单', text: '你找对了甲箱。封印下压着天字七号用印单，时间正是昨夜子时，所盖文件是神职名册。'},
      {id: 'truth-contradiction', type: 'contradiction', label: '矛盾 · 用印记录', title: '判官说印整夜没动过', text: '判官说官印整夜封存；甲箱里的天字七号用印单却记着子时盖印。两份说法无法同时成立。'}
    ]
  },
  {
    id: 'sticks', number: '三', department: '太白筹算司', title: '天数分配科', subtitle: '抢筹争先', examiner: '白算子', badge: '先机印',
    intro: '七根天签，每次取一或两根，取走最后一根者通过。',
    hint: '尽量把回合结束后的剩余签数留成三的倍数。七根开局，第一手取一根。',
    evidence: [
      {id: 'sticks-fact', type: 'fact', label: '事实 · 签筒夹页', title: '缺页就藏在签筒底', text: '最后一签被取走后，筒底露出天字七号名册缺页。上面的撤职名单有一处被重写。'},
      {id: 'sticks-motive', type: 'motive', label: '动机 · 撤职底稿', title: '被划掉的名字是白算子', text: '签筒底稿显示：白算子原在撤职名单上，名字后来被换成了你。谁动的笔尚待查证，但他有保住神位的利益。'}
    ]
  }
];

const state = {
  stage: 'intro', examIndex: 0, examResult: null, evidence: [], selectedEvidence: null, hearingSlots: {fact: null, contradiction: null, motive: null}, hearingTarget: null, hintVisible: false, archiveOpen: false,
  route: {flags: [], actor: {...ROUTE.start}, path: [], running: false, message: ''},
  truth: {selected: null, truth: [], message: ''},
  sticks: {pile: 7, turn: 'player', log: [], message: ''}
};

function currentExam() {return EXAMS[state.examIndex];}
function escapeHtml(value) {return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function showToast(text) {
  const toast = $('toast'); toast.textContent = text; toast.hidden = false;
  clearTimeout(showToast.timer); showToast.timer = setTimeout(() => {toast.hidden = true;}, 3200);
}
function updateHeader() {
  $('progress').textContent = state.stage === 'intro' ? '候补考生' : state.stage === 'ending' ? '公开听证结束' : `初试 ${Math.min(state.examIndex + (state.stage === 'hall' ? 0 : 1), 3)} / 3`;
  $('evidence-count').textContent = `卷宗 ${state.evidence.length}`;
}
function resetExamData() {
  actionEpoch += 1;
  state.hintVisible = false;
  state.examResult = null;
  state.selectedEvidence = null;
  state.route = {flags: [], actor: {...ROUTE.start}, path: [], running: false, message: ''};
  state.truth = {selected: null, truth: [], message: ''};
  state.sticks = {pile: 7, turn: 'player', log: [], message: ''};
}
function goTo(stage) {state.stage = stage; saveProgress(); render(); window.scrollTo({top: 0, behavior: 'instant'});}
function render() {
  updateHeader();
  const stage = $('stage');
  if (state.stage === 'intro') stage.innerHTML = renderIntro();
  else if (state.stage === 'hall') stage.innerHTML = renderHall();
  else if (state.stage === 'exam') stage.innerHTML = renderExam();
  else if (state.stage === 'hearing') stage.innerHTML = renderHearing();
  else stage.innerHTML = renderEnding();
}
function saveProgress() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({version: 1, stage: state.stage, evidence: state.evidence.map(card => card.id), slots: Object.fromEntries(Object.entries(state.hearingSlots).map(([key, card]) => [key, card?.id || null]))})); }
  catch { /* Storage is optional; the current session remains playable. */ }
}
function restoreProgress() {
  try {
    const data = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!data || data.version !== 1 || data.stage === 'intro' || !Array.isArray(data.evidence) || data.evidence.length > 3) return false;
    const cards = data.evidence.map((id, index) => EXAMS[index]?.evidence.find(card => card.id === id));
    if (cards.some(card => !card)) return false;
    state.evidence = cards; state.examIndex = cards.length === 3 ? 2 : cards.length;
    state.hearingSlots = Object.fromEntries(['fact', 'contradiction', 'motive'].map(key => [key, cards.find(card => card.id === data.slots?.[key]) || null]));
    state.stage = cards.length === 3 ? (data.stage === 'ending' ? 'ending' : 'hearing') : 'hall';
    return true;
  } catch { return false; }
}
function renderIntro() {
  return `<section class="screen intro-screen"><div class="intro-seal">天庭<br>考核</div><span class="eyebrow">百年一次 · 神职能力考核</span><h1>今日宜飞升</h1><p class="lead">神仙不打架，考核查旧账。</p><div class="intro-papers"><p>玉帝刚宣布：本届只有一个飞升名额。</p><p>封神榜却在名单公示前，少了一页。</p><p>你拿着一张法力栏空白的临时仙籍，被推上了考场。</p></div><button class="cta" data-action="enter">领取临时仙籍 <span>→</span></button><p class="micro-copy">约 8–12 分钟 · 无倒计时 · 每科自动存档<br>完成三科，解锁公开听证。考官可以嘴硬，规则不能说谎。</p></section>`;
}
function renderHall() {
  const completed = state.evidence.length;
  const cards = EXAMS.map((exam, index) => {
    const done = index < completed;
    const current = index === state.examIndex;
    return `<article class="exam-ticket ${done ? 'done' : ''} ${current ? 'current' : ''}"><div class="ticket-index">${exam.number}</div><div class="ticket-copy"><span>${escapeHtml(exam.department)}</span><h3>${escapeHtml(exam.title)}</h3><strong>${escapeHtml(exam.subtitle)}</strong><p>${escapeHtml(exam.intro)}</p></div><div class="ticket-side">${done ? '<b class="status">已通过</b>' : current ? '<b class="status live">待考</b>' : '<b class="status locked">待解锁</b>'}${current ? `<button class="small-cta" data-action="start-exam">开始考核 <span>→</span></button>` : ''}</div></article>`;
  }).join('');
  return `<section class="screen hall-screen"><div class="screen-heading"><div><span class="eyebrow">临时仙籍 · ${completed} 枚神职印</span><h1>天庭考核大厅</h1><p>太白金星：先把事情办成，再讨论谁该飞升。</p></div><div class="hall-stamp">${completed} / 3<br><small>初试</small></div></div><div class="notice"><b>本届异常</b><span>封神榜少了一页。玉帝要求：一个飞升名额，一个撤职名额。</span></div><div class="exam-list">${cards}</div><div class="hall-footer"><span>已收卷宗：${completed} / 3</span><button class="text-button" data-action="show-rules">考核规则</button></div></section>`;
}
function renderExam() {
  const exam = currentExam();
  const result = state.examResult;
  const body = exam.id === 'route' ? renderRouteExam(exam) : exam.id === 'truth' ? renderTruthExam(exam) : renderSticksExam(exam);
  return `<section class="screen exam-screen"><div class="exam-top"><div><span class="eyebrow">第${exam.number}科 · ${escapeHtml(exam.department)}</span><h1>${escapeHtml(exam.title)}<small>${escapeHtml(exam.subtitle)}</small></h1></div><div class="exam-meta"><span>考官</span><b>${escapeHtml(exam.examiner)}</b><i>${escapeHtml(exam.badge)}</i></div></div>${result ? renderExamResult(exam, result) : body}${state.hintVisible && !result ? `<div class="hint-note" role="status"><b>太白锦囊</b> ${escapeHtml(exam.hint)}</div>` : ''}</section>`;
}
function renderExamResult(exam, result) {
  const cards = exam.evidence.map(card => `<button class="evidence-pick ${state.selectedEvidence === card.id ? 'selected' : ''}" data-action="choose-evidence" data-card="${card.id}"><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(card.title)}</strong><p>${escapeHtml(card.text)}</p></button>`).join('');
  return `<div class="exam-result-layout"><div class="result-visual"><div class="result-seal ${result.success ? '' : 'pending'}">${result.success ? '过' : '补'}</div><span class="eyebrow">${result.success ? '考核通过 · 关键动作已记录' : '本题未通过 · 允许补考'}</span><h2>${escapeHtml(result.title)}</h2><p>${escapeHtml(result.copy)}</p><blockquote>${escapeHtml(result.quote)}</blockquote>${result.success ? `<div class="result-badge">获得 ${escapeHtml(exam.badge)}</div>` : `<button class="cta secondary-cta" data-action="retry-exam">重新考这科</button>`}</div>${result.success ? `<div class="evidence-packet"><span class="eyebrow">考后取证</span><h3>带走一张卷宗</h3><p>考官的解释和现场记录出现了一点偏差。选一张你愿意在终审时拿出来的证据。</p><div class="evidence-picks">${cards}</div><button class="cta ${state.selectedEvidence ? '' : 'disabled'}" data-action="collect-evidence" ${state.selectedEvidence ? '' : 'disabled'}>收下卷宗，进入下一科 <span>→</span></button></div>` : ''}</div>`;
}
function renderRouteExam(exam) {
  const cells = [];
  for (let y = 0; y < ROUTE.height; y++) for (let x = 0; x < ROUTE.width; x++) {
    const wall = wallAt({x, y}); const flag = state.route.flags.some(item => item.x === x && item.y === y); const step = state.route.path.some(item => item.x === x && item.y === y); const exit = x === ROUTE.exit.x && y === ROUTE.exit.y; const start = x === ROUTE.start.x && y === ROUTE.start.y;
    cells.push(`<button class="route-cell ${wall ? 'wall' : ''} ${flag ? 'flagged' : ''} ${step ? 'path' : ''} ${exit ? 'exit' : ''} ${start ? 'start' : ''}" data-action="route-cell" data-x="${x}" data-y="${y}" ${wall || start || state.route.running ? 'disabled' : ''} aria-label="${wall ? '屏风' : exit ? '退场口' : start ? '掌门起点' : `擂台第${y + 1}行第${x + 1}列${flag ? '，已放旗' : ''}`}">${wall ? '屏' : flag ? '旗' : exit ? '出' : ''}</button>`);
  }
  return `<div class="exam-layout"><div class="puzzle-stage route-stage"><div class="stage-caption"><span>不碰掌门，只改变他看见的目标。</span><b>${escapeHtml(state.route.message || '先放旗，再推演。')}</b></div><div class="route-board"><div class="route-grid">${cells.join('')}<span class="route-actor" style="left:${((state.route.actor.x + .5) / ROUTE.width) * 100}%;top:${((state.route.actor.y + .5) / ROUTE.height) * 100}%">岳</span></div></div><div class="route-legend"><span><i class="legend-dot actor"></i>岳不挪</span><span><i class="legend-dot flag"></i>请战旗</span><span><i class="legend-dot wall"></i>屏风</span><span><i class="legend-dot exit"></i>退场口</span></div></div><aside class="exam-aside"><div class="exam-brief"><span class="eyebrow">考官放话</span><blockquote>“我只是站在南天门，谁说我会走？”</blockquote><p>${escapeHtml(exam.intro)}</p></div><div class="rule-list"><b>规则</b><span>点格子放旗，最多两面；再点可收回。</span><span>只看同排、同列且不被屏风挡住的旗。</span><span>先走最近的旗；同距时先走先放的。</span><span>到旗边会收旗，再寻找下一面。</span><span>走出边线，考核通过。</span></div><div class="aside-actions"><button class="small-cta" data-action="route-preview" ${state.route.running ? 'disabled' : ''}>推演路线</button><button class="cta" data-action="route-run" ${state.route.flags.length === 0 || state.route.running ? 'disabled' : ''}>鸣锣，让他赴约 <span>→</span></button><button class="text-button" data-action="hint">听一句提示</button><button class="text-button" data-action="reset-exam">重置棋盘</button></div></aside></div>`;
}
function renderTruthExam(exam) {
  const truth = state.truth.truth;
  return `<div class="exam-layout"><div class="puzzle-stage truth-stage"><div class="stage-caption"><span>三句话里，恰有一句为真。</span><b>${escapeHtml(state.truth.message || '先在脑中假设，再点箱子。')}</b></div><div class="statement-stack">${TRUTH_STATEMENTS.map((item, index) => `<div class="statement ${truth.length ? (truth[index] ? 'true' : 'false') : ''}"><span>${item.speaker}</span><p>${item.text}</p>${truth.length ? `<b>${truth[index] ? '真' : '假'}</b>` : ''}</div>`).join('')}</div><div class="truth-condition">题面条件：<strong>恰有一句为真</strong></div><div class="box-row">${BOXES.map((box, index) => `<button class="truth-box ${state.truth.selected === index ? 'selected' : ''}" data-action="truth-box" data-box="${index}"><span>${box[0]}</span><small>封印候选</small></button>`).join('')}</div><button class="cta truth-submit" data-action="submit-truth" ${state.truth.selected === null ? 'disabled' : ''}>请开箱，核对口供 <span>→</span></button></div><aside class="exam-aside"><div class="exam-brief"><span class="eyebrow">判官放话</span><blockquote>“本题只有一个答案，别拿情绪价值来对账。”</blockquote><p>${escapeHtml(exam.intro)}</p></div><div class="rule-list"><b>推理提示</b><span>假设印在每一个箱子里。</span><span>数三句分别为真还是为假。</span><span>只有真话数量等于一的箱子成立。</span></div><div class="aside-actions"><button class="text-button" data-action="hint">看一层提示</button><button class="text-button" data-action="reset-exam">重新读题</button></div></aside></div>`;
}
function renderSticksExam(exam) {
  return `<div class="exam-layout"><div class="puzzle-stage sticks-stage"><div class="stage-caption"><span>轮到你时，取一根或两根。</span><b>${escapeHtml(state.sticks.message || (state.sticks.turn === 'player' ? '先手，七根签。' : '白算子正在算。'))}</b></div><div class="stick-table"><div class="stick-pile">${Array.from({length: state.sticks.pile}, (_, index) => `<i style="--i:${index}"></i>`).join('') || '<em>空</em>'}</div><div class="turn-badge">${state.sticks.turn === 'player' ? '轮到你' : '白算子思考中'} · 剩余 ${state.sticks.pile}</div><div class="stick-actions"><button class="cta" data-action="take-sticks" data-take="1" ${state.sticks.turn !== 'player' || state.sticks.pile < 1 ? 'disabled' : ''}>取一根</button><button class="small-cta" data-action="take-sticks" data-take="2" ${state.sticks.turn !== 'player' || state.sticks.pile < 2 ? 'disabled' : ''}>取两根</button></div><div class="action-log">${state.sticks.log.map(item => `<span class="${item.who === '你' ? 'you' : 'opponent'}">${item.who}取${item.count} · 剩 ${item.left}</span>`).join('')}</div></div></div><aside class="exam-aside"><div class="exam-brief"><span class="eyebrow">白算子放话</span><blockquote>“你随便取，我真的不在乎。”</blockquote><p>${escapeHtml(exam.intro)}</p></div><div class="rule-list"><b>规则</b><span>每次只能取一根或两根。</span><span>取走最后一根者通过。</span><span>你先手。输掉本局可以立即补考。</span></div><div class="aside-actions"><button class="text-button" data-action="hint">给我一层提示</button><button class="text-button" data-action="reset-exam">重新摆签</button></div></aside></div>`;
}
function renderHearing() {
  const cards = state.evidence.map(card => `<button class="evidence-card ${Object.values(state.hearingSlots).some(item => item?.id === card.id) ? 'used' : ''}" data-action="assign-evidence" data-card="${card.id}"><span>${escapeHtml(card.label)}</span><strong>${escapeHtml(card.title)}</strong><p>${escapeHtml(card.text)}</p></button>`).join('');
  const slot = type => {const card = state.hearingSlots[type]; return `<button class="hearing-slot ${card ? 'filled' : ''} ${state.hearingTarget === type ? 'targeted' : ''}" data-action="hearing-slot" data-slot="${type}"><span>${type === 'fact' ? '一' : type === 'contradiction' ? '二' : '三'}</span><b>${type === 'fact' ? '发生了什么？' : type === 'contradiction' ? '谁说法对不上？' : '谁可能获利？'}</b><small>${card ? escapeHtml(card.title) : '点击后放入一张卷宗'}</small></button>`;};
  return `<section class="hearing-screen"><div class="hearing-heading"><span class="eyebrow">三科初试完成 · 公开听证前</span><h1>把天庭旧账，摆到台面上。</h1><p>太白金星：“成绩单可以先放着，卷宗请各位按事实摆。”</p></div><div class="hearing-layout"><div class="hearing-board"><div class="hearing-slots">${slot('fact')}${slot('contradiction')}${slot('motive')}</div><div class="hearing-arrow">证据链</div><div class="evidence-row">${cards}</div></div><aside class="hearing-aside"><div class="judge-panel"><span>玉帝批示</span><strong>“朕只问三件事：发生了什么，谁在说谎，谁得了好处。”</strong><small>先点一个槽位，再点一张卷宗。</small></div><button class="cta" data-action="submit-hearing" >提交公开听证 <span>→</span></button><button class="text-button" data-action="auto-hearing">按最完整证据整理</button><button class="text-button" data-action="toggle-archive">回看考后卷宗 / 更换证据</button><p class="micro-copy">缺证也可提交结算，之后可以补证再审。</p></aside></div>${state.archiveOpen ? renderArchive() : ''}</section>`;
}
function renderArchive() {
  return `<section class="archive"><h2>调阅三科旧卷</h2><p>已通关的卷宗可重新取证，无须重考。每科保留一张。</p>${EXAMS.map((exam, index) => `<div><h3>${exam.subtitle}</h3><div class="evidence-picks">${exam.evidence.map(card => `<button class="evidence-pick ${state.evidence[index]?.id === card.id ? 'selected' : ''}" data-action="swap-evidence" data-exam="${index}" data-card="${card.id}"><span>${card.label}</span><strong>${card.title}</strong><p>${card.text}</p></button>`).join('')}</div></div>`).join('')}</section>`;
}
function renderEnding() {
  const verdict = evidenceVerdict(state.evidence, state.hearingSlots);
  const full = verdict.complete;
  return `<section class="screen ending-screen"><div class="ending-seal">${full ? '揭' : '过'}</div><span class="eyebrow">公开听证 · 初试结算</span><h1>${full ? '封神榜缺页案，正式立案。' : '初试通过，旧账仍未闭合。'}</h1><p class="ending-lead">${full ? '天字七号残角、子时用印记录和被改写的撤职底稿相互印证。玉帝下令封存官印，暂停三位考官职务，调查名册篡改。你获任临时巡查使。' : '你通过了全部能力考核。但卷宗还不能分别回答事实、矛盾和动机，玉帝暂缓立案。你可以回看卷宗，补齐后再审。'}</p><blockquote>${full ? '玉帝：“先把飞升名额放一边。谁来解释这页纸？”' : '太白金星：“恭喜通过。至于那一页……我们下届再查。”'}</blockquote><div class="ending-stats"><span>通过科目 <b>3 / 3</b></span><span>卷宗数量 <b>${state.evidence.length}</b></span><span>证据闭合 <b>${full ? '3 / 3' : `${verdict.matchedCount} / 3`}</b></span></div>${!full ? `<p class="hint-note">待补：${verdict.missing.map(type => ({fact:"事实", contradiction:"矛盾", motive:"动机"}[type])).join("、")}</p>` : `<p class="micro-copy">第一章完 · 立案并非定罪，具体执笔人仍待调查。</p>`}<div class="ending-actions"><button class="small-cta" data-action="reopen-hearing">回看卷宗 / 再审</button><button class="cta" data-action="restart-all">再考一届 <span>↗</span></button><a class="text-button" href="../../#lab/philosophy">回到设计笔记</a></div></section>`;
}

function showExamResult(success, title, copy, quote) {state.examResult = {success, title, copy, quote}; render(); window.scrollTo({top: 0, behavior: 'instant'});}
function resetCurrentExam() {resetExamData(); render();}
function selectEvidence(id) {state.selectedEvidence = id; render();}
function collectEvidence() {
  if (!state.selectedEvidence) return;
  const card = currentExam().evidence.find(item => item.id === state.selectedEvidence);
  state.evidence.push(card); state.selectedEvidence = null;
  if (state.examIndex >= EXAMS.length - 1) goTo('hearing'); else {state.examIndex += 1; resetExamData(); goTo('hall');}
}
function updateRouteVisuals() {
  const grid = document.querySelector('.route-grid'); if (!grid) return;
  grid.querySelectorAll('.route-cell').forEach(cell => {
    const x = Number(cell.dataset.x), y = Number(cell.dataset.y);
    const flag = state.route.flags.some(item => item.x === x && item.y === y);
    const path = state.route.path.some(item => item.x === x && item.y === y);
    cell.classList.toggle('flagged', flag); cell.classList.toggle('path', path);
    if (flag) cell.textContent = '旗'; else if (x === ROUTE.exit.x && y === ROUTE.exit.y) cell.textContent = '出'; else if (!wallAt({x, y})) cell.textContent = '';
  });
  const actor = document.querySelector('.route-actor');
  if (actor) {actor.style.left = `${((state.route.actor.x + .5) / ROUTE.width) * 100}%`; actor.style.top = `${((state.route.actor.y + .5) / ROUTE.height) * 100}%`;}
}
function routeCell(x, y) {
  if (state.route.running || wallAt({x, y}) || (x === ROUTE.start.x && y === ROUTE.start.y)) return;
  const index = state.route.flags.findIndex(item => item.x === x && item.y === y);
  if (index >= 0) state.route.flags.splice(index, 1);
  else if (state.route.flags.length >= 2) {showToast('本题最多两面旗。先点一面已放的旗收回来。'); return;}
  else state.route.flags.push({x, y});
  state.route.path = [];
  state.route.message = state.route.flags.length ? `已放 ${state.route.flags.length} / 2 面旗。` : '先放旗，再推演。';
  updateRouteVisuals(); render();
}
function previewRoute() {
  const result = simulateRoute(state.route.flags);
  if (result.reason === 'invalid') {state.route.message = '请先在擂台上放至少一面旗。'; render(); return;}
  state.route.path = result.steps; state.route.message = result.won ? `路线成立，${result.steps.length} 步后出界。` : '这条路线走不通，掌门看不见下一面旗。';
  updateRouteVisuals(); render();
}
async function runRoute() {
  if (state.route.running) return;
  const epoch = ++actionEpoch;
  const result = simulateRoute(state.route.flags);
  if (!result.won) {state.route.message = '鸣锣前先推演：掌门还走不出边线。'; render(); return;}
  state.route.running = true; state.route.path = result.steps; state.route.message = '岳不挪：“我只是顺路看看。”'; render();
  for (const step of result.steps) {await new Promise(resolve => setTimeout(resolve, 230)); if (epoch !== actionEpoch) return; state.route.actor = step; state.route.flags = state.route.flags.filter(flag => flag.x !== step.x || flag.y !== step.y); updateRouteVisuals();}
  await new Promise(resolve => setTimeout(resolve, 350));
  if (epoch !== actionEpoch) return;
  state.route.running = false;
  showExamResult(true, '掌门自己出圈了。', '你没有碰他，只把请战旗放在他看得见的地方。他正要找台阶，袖中却掉出带有子时出入章的封神榜残角。', '岳不挪：“我是主动扩展答题空间。” 裁判：“您已经在考场外了。”');
}
function submitTruth() {
  if (state.truth.selected === null) return;
  const result = truthVerdict(state.truth.selected); state.truth.truth = result.truth;
  if (result.correct) showExamResult(true, '唯一答案被你找到了。', '甲箱：甲说假话、乙说真话、丙说假话，恰好一真。封印下面还压着子时用印单，判官的“整夜未动”当场翻车。', '判官：“本题只有一个答案。” 你：“那请解释旧卷宗。”');
  else {state.truth.message = `${BOXES[state.truth.selected]}会让 ${result.truth.filter(Boolean).length} 句为真，不符合题面。`; render();}
}
function takeSticks(count) {
  if (state.examResult || state.sticks.turn !== 'player' || ![1, 2].includes(count) || count > state.sticks.pile) return;
  const epoch = actionEpoch;
  state.sticks.pile -= count; state.sticks.log.push({who: '你', count, left: state.sticks.pile});
  if (state.sticks.pile === 0) {showExamResult(true, '最后一根签，落在你手里。', '白算子没有机会翻盘。空签筒底露出了名册缺页：撤职底稿上，他的名字被改成了你的。', '白算子：“我只是让你先。” 裁判：“您让的是胜局。”'); return;}
  state.sticks.turn = 'opponent'; state.sticks.message = '白算子开始假装不在乎。'; render();
  setTimeout(() => {
    if (epoch !== actionEpoch || state.stage !== 'exam') return;
    const move = opponentStickMove(state.sticks.pile); state.sticks.pile -= move; state.sticks.log.push({who: '白算子', count: move, left: state.sticks.pile});
    if (state.sticks.pile === 0) {state.sticks.turn = 'player'; showExamResult(false, '白算子拿走了最后一根。', '白算子拿走了最后一根。这局的关键是每次留给他 6 根或 3 根；七根开局先取一根，再让每轮双方合计取三根。', '白算子：“我说了，你随便。”'); return;}
    state.sticks.turn = 'player'; state.sticks.message = `白算子取了 ${move} 根。轮到你，剩 ${state.sticks.pile} 根。`; render();
  }, 550);
}
function assignEvidence(id) {
  const card = state.evidence.find(item => item.id === id); if (!card || !state.hearingTarget) {showToast('先点一个证据槽位。'); return;}
  for (const type of Object.keys(state.hearingSlots)) if (state.hearingSlots[type]?.id === id) state.hearingSlots[type] = null;
  state.hearingSlots[state.hearingTarget] = card; state.hearingTarget = null; saveProgress(); render();
}
function autoHearing() {
  state.hearingSlots = {fact: state.evidence.find(card => card.type === 'fact') || null, contradiction: state.evidence.find(card => card.type === 'contradiction') || null, motive: state.evidence.find(card => card.type === 'motive') || null}; saveProgress(); render();
}
function submitHearing() {goTo('ending');}
function restartAll() {state.stage = 'intro'; state.examIndex = 0; state.examResult = null; state.evidence = []; state.selectedEvidence = null; state.hearingSlots = {fact: null, contradiction: null, motive: null}; state.hearingTarget = null; resetExamData(); saveProgress(); render();}

function handleClick(event) {
  const target = event.target.closest('[data-action]'); if (!target || target.disabled) return;
  const action = target.dataset.action;
  if (action === 'enter') {goTo('hall'); return;}
  if (action === 'start-exam') {resetExamData(); goTo('exam'); return;}
  if (action === 'route-cell') {routeCell(Number(target.dataset.x), Number(target.dataset.y)); return;}
  if (action === 'route-preview') {previewRoute(); return;}
  if (action === 'route-run') {runRoute(); return;}
  if (action === 'submit-truth') {submitTruth(); return;}
  if (action === 'truth-box') {state.truth.selected = Number(target.dataset.box); state.truth.truth = []; state.truth.message = `已选 ${BOXES[state.truth.selected]}，可以提交核对。`; render(); return;}
  if (action === 'take-sticks') {takeSticks(Number(target.dataset.take)); return;}
  if (action === 'hint') {state.hintVisible = !state.hintVisible; render(); document.querySelector('.hint-note')?.scrollIntoView({block:'nearest'}); return;}
  if (action === 'reset-exam' || action === 'retry-exam') {resetCurrentExam(); return;}
  if (action === 'choose-evidence') {selectEvidence(target.dataset.card); return;}
  if (action === 'collect-evidence') {collectEvidence(); return;}
  if (action === 'hearing-slot') {state.hearingTarget = target.dataset.slot; render(); return;}
  if (action === 'assign-evidence') {assignEvidence(target.dataset.card); return;}
  if (action === 'auto-hearing') {autoHearing(); return;}
  if (action === 'submit-hearing') {submitHearing(); return;}
  if (action === 'restart-all') {restartAll(); return;}
  if (action === 'reopen-hearing') {state.archiveOpen = true; goTo('hearing'); return;}
  if (action === 'toggle-archive') {state.archiveOpen = !state.archiveOpen; render(); return;}
  if (action === 'swap-evidence') {const index = Number(target.dataset.exam); const card = EXAMS[index]?.evidence.find(item => item.id === target.dataset.card); if (!card) return; const old = state.evidence[index]; state.evidence[index] = card; for (const type of Object.keys(state.hearingSlots)) if (state.hearingSlots[type]?.id === old?.id) state.hearingSlots[type] = null; saveProgress(); render(); showToast('卷宗已更换，请重新放入证据链。'); return;}
  if (action === 'show-rules') {showToast('每科先看规则，再动一个东西；通过后带走一张卷宗。'); return;}
}

$('stage').addEventListener('click', handleClick);
restoreProgress();
render();
