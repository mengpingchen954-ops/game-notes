import React, {useEffect, useRef, useState} from 'react';
import {AlertCircle, ArrowRight, BarChart3, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, ClipboardCheck, Download, FileText, RotateCcw, Target, Upload} from 'lucide-react';
import {ConfirmDialog} from './components';
import {download} from './model';
import {parsePlan} from './planData';
import {dateForDay, dayForDate, emptyPlanProgress, loadPlanProgress, parsePlanProgress, savePlanProgress, serializePlanProgress} from './planProgress';
import plan from './plan.md?raw';

const {weeks, days, references, scheduleIntro} = parsePlan(plan);
const phases = [
  {title: '建立选品池', range: 'D01-D07', start: 1, end: 7, icon: Target},
  {title: '四个玩法原型', range: 'D08-D21', start: 8, end: 21, icon: ClipboardCheck},
  {title: '同条件对照', range: 'D22-D30', start: 22, end: 30, icon: BarChart3},
  {title: '完成游戏循环', range: 'D31-D49', start: 31, end: 49, icon: Target},
  {title: '实机测试与发布', range: 'D50-D63', start: 50, end: 63, icon: ClipboardCheck},
  {title: '验证开发工具', range: 'D64-D77', start: 64, end: 77, icon: BarChart3},
  {title: '课程判断与下一轮', range: 'D78-D90', start: 78, end: 90, icon: BookOpen}
];
const tabs = [
  {key: 'daily', label: '每日打卡', icon: ClipboardCheck},
  {key: 'overview', label: '阶段概览', icon: BarChart3},
  {key: 'selection', label: '方法与选品', icon: Target},
  {key: 'distribution', label: '内容与分发', icon: BookOpen},
  {key: 'decisions', label: '闸门与记录', icon: CalendarDays}
];

function entryFor(progress, id) {
  return progress.days[id] || {game: false, content: false, note: '', checkedInAt: null};
}

export default function PlanView({onDirtyChange}) {
  const [initial] = useState(loadPlanProgress);
  const [progress, setProgress] = useState(initial.progress || emptyPlanProgress());
  const [loadError, setLoadError] = useState(initial.error);
  const [writeError, setWriteError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState('daily');
  const [pendingImport, setPendingImport] = useState(null);
  const [rawData, setRawData] = useState(initial.raw);
  const fileInput = useRef(null);
  const selected = days[progress.selectedDay - 1] || days[0];
  const entry = entryFor(progress, selected.id);
  const [noteDraft, setNoteDraft] = useState(entry.note);
  const week = weeks[selected.week - 1];
  const checkedDays = days.filter(day => entryFor(progress, day.id).checkedInAt).length;
  const checkedTasks = days.reduce((count, day) => {
    const item = entryFor(progress, day.id);
    return count + Number(item.game) + Number(item.content);
  }, 0);
  const today = dayForDate(progress.startDate);
  const selectedDate = dateForDay(progress.startDate, selected.number);

  useEffect(() => { setNoteDraft(entryFor(progress, selected.id).note); }, [selected.id]);
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(() => setMessage(''), 4500);
    return () => clearTimeout(timeout);
  }, [message]);

  function persist(next) {
    if (loadError) return false;
    try {
      const saved = savePlanProgress(next);
      setProgress(saved);
      setWriteError('');
    } catch {
      setWriteError('保存失败：浏览器存储不可用或空间不足。当前输入尚未保存，请导出当前进度。');
      onDirtyChange?.(true);
      return false;
    }
    onDirtyChange?.(false);
    return true;
  }

  function updateEntry(changes) {
    return persist({...progress, days: {...progress.days, [selected.id]: {...entry, note: noteDraft, ...changes}}});
  }

  function selectDay(number) {
    if (number < 1 || number > 90 || number === selected.number) { setActiveTab('daily'); return; }
    const noteDirty = noteDraft !== entry.note;
    if (noteDirty) {
      if (loadError || !persist({
        ...progress,
        selectedDay: number,
        days: {...progress.days, [selected.id]: {...entry, note: noteDraft}}
      })) return;
    } else {
      if (!persist({...progress, selectedDay: number})) {
        setProgress(current => ({...current, selectedDay: number}));
      }
    }
    setNoteDraft(entryFor(progress, days[number - 1].id).note);
    setActiveTab('daily');
  }

  function switchTab(key) {
    if (key === activeTab) return;
    if (noteDraft !== entry.note && !loadError && !updateEntry({note: noteDraft})) return;
    setActiveTab(key);
  }

  function changeNote(value) {
    setNoteDraft(value);
    if (!updateEntry({note: value})) onDirtyChange?.(value !== entry.note);
  }

  function checkIn() {
    if (!entry.game && !entry.content && !noteDraft.trim()) return;
    if (updateEntry({note: noteDraft, checkedInAt: entry.checkedInAt || new Date().toISOString()})) setMessage('今日打卡已保存');
  }

  async function importFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 1024 * 1024) { setWriteError('导入失败：备份文件不能超过 1 MB。'); return; }
    try {
      setPendingImport(parsePlanProgress(await file.text()));
      setWriteError('');
    } catch (error) {
      setWriteError('导入失败：' + error.message);
    }
  }

  function restoreImport() {
    try {
      const saved = savePlanProgress(pendingImport);
      setProgress(saved);
      setNoteDraft(entryFor(saved, days[saved.selectedDay - 1].id).note);
      setLoadError('');
      setWriteError('');
      setRawData(null);
      setPendingImport(null);
      setMessage('打卡备份已恢复');
      onDirtyChange?.(false);
    } catch {
      setWriteError('导入失败：浏览器无法保存这份备份，原有进度未被覆盖。');
      setPendingImport(null);
    }
  }

  return <div className="plan-module">
    <header className="plan-module-header">
      <div className="plan-eyebrow">个人工作台 / 90天计划</div>
      <h1>90天执行计划</h1>
      <p>经典玩法 × 当下情绪 × 一条规则</p>
      <div className="plan-metrics" aria-label="计划进度">
        <div><strong>{checkedDays}<small> / 90</small></strong><span>已打卡天数</span></div>
        <div><strong>{checkedTasks}<small> / 180</small></strong><span>已勾选行动</span></div>
        <div className="plan-metrics-track"><span>打卡进度</span><div role="progressbar" aria-label="打卡进度" aria-valuemin={0} aria-valuemax={90} aria-valuenow={checkedDays}><i style={{width: `${checkedDays / 90 * 100}%`}}/></div><b>{Math.round(checkedDays / 90 * 100)}%</b></div>
      </div>
    </header>

    <nav className="plan-tabs" role="tablist" aria-label="计划模块">{tabs.map(({key, label, icon: Icon}) => <button
      type="button" key={key} id={`plan-tab-${key}`} role="tab" aria-controls={`plan-panel-${key}`} aria-selected={activeTab === key}
      className={activeTab === key ? 'active' : ''} onClick={() => switchTab(key)}><Icon size={17}/>{label}</button>)}</nav>

    {loadError && <div className="plan-alert" role="alert"><AlertCircle size={19}/><span>{loadError}</span>{rawData !== null && <button type="button" onClick={() => download(rawData, '90天打卡-原始数据.txt', 'text/plain')}>导出原始数据</button>}</div>}
    {writeError && <div className="plan-alert" role="alert"><AlertCircle size={19}/><span>{writeError}</span></div>}
    {message && <div className="plan-message" role="status"><Check size={16}/>{message}</div>}

    {activeTab === 'daily' && <section className="plan-panel" id="plan-panel-daily" role="tabpanel" aria-labelledby="plan-tab-daily">
      <div className="plan-controls"><label className="plan-start-date"><CalendarDays size={17}/><span>开始日期</span><input type="date" value={progress.startDate} disabled={!!loadError} onChange={event => persist({...progress, startDate: event.target.value})}/></label>
        <div className="plan-controls-actions">{today && <button type="button" className="secondary" onClick={() => selectDay(today)}>今天 D{String(today).padStart(2, '0')}</button>}<button type="button" className="secondary" onClick={() => switchTab('overview')}>阶段概览<ArrowRight size={15}/></button></div>
      </div>
      <div className="plan-schedule-intro" dangerouslySetInnerHTML={{__html: scheduleIntro}}/>
      <div className="plan-week-heading"><div><span>{week.number === 13 ? '收尾' : `第 ${week.number} 周`} / {week.days.length} 天</span><h2>{week.title}</h2></div>
        <select aria-label="选择周次" value={week.number} onChange={event => selectDay(weeks[Number(event.target.value) - 1].days[0].number)}>{weeks.map(item => <option key={item.number} value={item.number}>{item.title}</option>)}</select>
      </div>
      <nav className="plan-days" aria-label="本周每日任务">{week.days.map(day => {
        const done = !!entryFor(progress, day.id).checkedInAt;
        return <button type="button" key={day.id} className={(day.number === selected.number ? 'active ' : '') + (done ? 'done' : '')} aria-current={day.number === selected.number ? 'date' : undefined}
          onClick={() => selectDay(day.number)}><span>{day.id}</span>{done && <Check size={15} aria-label="已打卡"/>}</button>;
      })}</nav>

      <section className="plan-day-detail" aria-labelledby="plan-day-title">
        <header className="plan-day-head"><div><span className="plan-day-kicker">{selected.id}{selectedDate && ` · ${selectedDate}`}</span>
          <h3 id="plan-day-title">{entry.checkedInAt ? '已打卡' : '今日行动'} <small>{Number(entry.game) + Number(entry.content)} / 2 项</small></h3></div>
          <div className="plan-day-switch"><button type="button" title="前一天" aria-label="前一天" disabled={selected.number === 1} onClick={() => selectDay(selected.number - 1)}><ChevronLeft size={20}/></button><button type="button" title="后一天" aria-label="后一天" disabled={selected.number === 90} onClick={() => selectDay(selected.number + 1)}><ChevronRight size={20}/></button></div>
        </header>
        <div className="plan-task-list"><label className={'plan-task '+(entry.game ? 'checked' : '')}><input type="checkbox" checked={entry.game} disabled={!!loadError} onChange={event => updateEntry({game: event.target.checked})}/><span><strong>游戏 / 选品</strong><span className="plan-task-copy" dangerouslySetInnerHTML={{__html: selected.game.html}}/></span></label>
          <label className={'plan-task '+(entry.content ? 'checked' : '')}><input type="checkbox" checked={entry.content} disabled={!!loadError} onChange={event => updateEntry({content: event.target.checked})}/><span><strong>内容 / 验证与产出</strong><span className="plan-task-copy" dangerouslySetInnerHTML={{__html: selected.content.html}}/></span></label></div>
        <div className="plan-day-log"><label htmlFor="plan-note">实际产出与卡点</label><textarea id="plan-note" value={noteDraft} maxLength={2000} disabled={!!loadError} onChange={event => changeNote(event.target.value)} placeholder="记录今天做出的东西、测试数字或需要处理的问题"/><div className="plan-day-log-footer"><span>{entry.checkedInAt ? `打卡于 ${new Date(entry.checkedInAt).toLocaleDateString('zh-CN')}` : `${noteDraft.length} / 2000`}</span>
          <div>{entry.checkedInAt && <button type="button" className="secondary" disabled={!!loadError} onClick={() => { if (updateEntry({checkedInAt: null})) setMessage('已撤销这一天的打卡'); }}><RotateCcw size={15}/>撤销打卡</button>}<button type="button" className="primary" disabled={!!loadError || (!entry.game && !entry.content && !noteDraft.trim())} onClick={checkIn}><Check size={16}/>{entry.checkedInAt ? '保存今日记录' : '完成今日打卡'}</button></div></div></div>
      </section>
    </section>}

    {activeTab === 'overview' && <section className="plan-panel" id="plan-panel-overview" role="tabpanel" aria-labelledby="plan-tab-overview">
      <div className="plan-panel-heading"><div><h2>按阶段推进</h2><p>每一段都以真实试玩、实际产出和明确决策收尾。</p></div><button type="button" className="primary" onClick={() => switchTab('daily')}>继续 {selected.id}<ArrowRight size={16}/></button></div>
      <div className="plan-phase-grid">{phases.map(({title, range, start, end, icon: Icon}) => {
        const completed = days.slice(start - 1, end).filter(day => entryFor(progress, day.id).checkedInAt).length;
        const next = days.slice(start - 1, end).find(day => !entryFor(progress, day.id).checkedInAt)?.number || start;
        return <button type="button" className="plan-phase" key={range} onClick={() => selectDay(next)}><span className="plan-phase-top"><span className="plan-phase-icon"><Icon size={20}/></span><span className="plan-phase-range">{range}</span><ArrowRight size={17}/></span><strong>{title}</strong><span className="plan-phase-bottom">已打卡 {completed} / {end - start + 1} 天</span><span className="plan-phase-bar"><i style={{width: `${completed / (end - start + 1) * 100}%`}}/></span></button>;
      })}</div>
    </section>}

    {['selection', 'distribution', 'decisions'].includes(activeTab) && <section className="plan-panel plan-reference" id={`plan-panel-${activeTab}`} role="tabpanel" aria-labelledby={`plan-tab-${activeTab}`} dangerouslySetInnerHTML={{__html: references[activeTab]}}/>}

    <footer className="plan-data-footer"><div><strong>打卡数据保存在当前浏览器</strong><p>换设备或清除浏览器数据前请导出进度；侧栏“备份”仅包含游戏分析，不包含这里的打卡。</p></div><div className="plan-data-actions"><button type="button" className="secondary" onClick={() => download(plan, '经典玩法_热梗规则_90天执行计划.md', 'text/markdown')}><FileText size={16}/>原文</button><button type="button" className="secondary" disabled={!!loadError} onClick={() => { const current = {...progress, days: {...progress.days, [selected.id]: {...entry, note: noteDraft}}}; download(serializePlanProgress(current), `90天打卡-备份-${new Date().toISOString().slice(0, 10)}.json`); setMessage(writeError ? '已导出当前输入；浏览器内仍未保存' : '打卡备份已导出'); }}><Download size={16}/>导出进度</button><button type="button" className="secondary" onClick={() => fileInput.current?.click()}><Upload size={16}/>导入进度</button><input ref={fileInput} type="file" accept=".json,application/json" hidden aria-label="导入打卡备份" onChange={importFile}/></div></footer>
    {pendingImport && <ConfirmDialog title="恢复90天打卡进度？" body="导入会用文件中的打卡、备注和开始日期完整覆盖当前浏览器里的计划进度。建议先导出当前备份。" confirmLabel="覆盖并恢复" danger onConfirm={restoreImport} onCancel={() => setPendingImport(null)}/>}
  </div>;
}
