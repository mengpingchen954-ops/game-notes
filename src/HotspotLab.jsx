import React from 'react';
import {ArrowLeft, ArrowRight, BarChart3, BookOpen, CalendarClock, CheckCircle2, Flame, Gamepad2, Layers3, Lightbulb, Play, Radar, ShieldCheck, Sparkles, Target, Workflow} from 'lucide-react';
import {hotspotGroups, hotspotTopics, topicForKey, topicsForGroup} from './hotspotData';

const groupIcons = {selection: Target, translation: Lightbulb, validation: Play, production: Workflow, philosophy: BookOpen};

function TopicCard({topic, onOpen}) {
  return <button type="button" className="lab-topic-card" onClick={() => onOpen(topic.key)}>
    <span className="lab-topic-card-top"><span>{topic.label}</span><ArrowUpRightIcon/></span>
    <strong>{topic.title}</strong>
    <p>{topic.summary}</p>
    <span className="lab-topic-tags">{topic.tags.map(tag => <em key={tag}>{tag}</em>)}</span>
  </button>;
}

function ArrowUpRightIcon() {
  return <ArrowRight size={18} aria-hidden="true"/>;
}

function SectionContent({section}) {
  return <section className="lab-article-section">
    <h2>{section.title}</h2>
    {section.callout && <blockquote>{section.callout.split('\n').map((line, index) => <span key={line}>{index > 0 && <br/>}{line}</span>)}</blockquote>}
    {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    {section.bullets && <ul>{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
    {section.steps && <ol className="lab-steps">{section.steps.map((step, index) => <li key={step.label}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{step.label}</strong><p>{step.body}</p></div></li>)}</ol>}
    {section.table && <div className="lab-table-wrap" role="region" aria-label={`${section.title}表格`} tabIndex="0"><table><thead><tr>{section.table.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{section.table.rows.map(row => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={index}>{cell}</th> : <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>}
  </section>;
}

function LabStatus() {
  return <div className="lab-status" role="note"><div><span>当前状态</span><strong>内部选品工具蓝图</strong></div><div><span>更新方式</span><strong>先手动 / 后自动</strong></div><div><span>边界</span><strong>尚未接入实时抓取</strong></div></div>;
}

export default function HotspotLab({topicKey, onView}) {
  const topic = topicForKey(topicKey);
  if (topicKey && !topic) return <Overview onView={onView}/>;
  if (topic) return <TopicDetail topic={topic} onView={onView}/>;
  return <Overview onView={onView}/>;
}

function Overview({onView}) {
  return <div className="lab-module">
    <header className="lab-header">
      <div className="lab-eyebrow"><Flame size={16}/>独立模块 / 选品与热点</div>
      <h1>热点实验室</h1>
      <p>把变化的网络情绪，转成可验证的2D / 3D休闲益智玩法。</p>
      <LabStatus/>
    </header>
    <section className="lab-principle"><div className="lab-principle-icon"><Sparkles size={22}/></div><div><strong>核心链路</strong><p>热点情绪 → 经典玩法 → 一条新规则 → 15秒玩法视频 → Cocos试玩广告 → 完整小游戏</p><small>热梗负责第一眼吸引力；规则、操作和重玩理由负责判断是否值得继续。</small></div></section>
    <nav className="lab-group-jump" aria-label="热点实验室分组">{hotspotGroups.map(group => <button type="button" onClick={() => document.getElementById(`lab-group-${group.key}`)?.scrollIntoView({behavior: 'smooth', block: 'start'})} key={group.key}>{group.number} {group.title}</button>)}</nav>
    <div className="lab-groups">{hotspotGroups.map(group => {
      const Icon = groupIcons[group.key];
      return <section className="lab-group" id={`lab-group-${group.key}`} key={group.key}>
        <header className="lab-group-header"><span className="lab-group-number">{group.number}</span><Icon size={21}/><div><h2>{group.title}</h2><p>{group.description}</p></div></header>
        <div className="lab-topic-grid">{topicsForGroup(group.key).map(topic => <TopicCard topic={topic} onOpen={key => onView(`lab:${key}`)} key={topic.key}/>)}</div>
      </section>;
    })}</div>
    <footer className="lab-footer"><div><strong>怎么开始</strong><p>先打开“客观选品闸门”和“验证漏斗”，再为一个候选做规则草图。每日执行仍在90天打卡模块里记录。</p></div><button type="button" className="primary" onClick={() => onView('plan')}><CalendarClock size={16}/>回到90天打卡<ArrowRight size={16}/></button></footer>
  </div>;
}

function TopicDetail({topic, onView}) {
  const group = hotspotGroups.find(item => item.key === topic.group);
  const siblingTopics = topicsForGroup(topic.group);
  const Icon = groupIcons[topic.group];
  return <div className="lab-module lab-detail">
    <button type="button" className="lab-back" onClick={() => onView('lab')}><ArrowLeft size={17}/>返回热点实验室</button>
    <header className="lab-detail-header"><div className="lab-eyebrow"><Icon size={16}/>{group.number} / {group.title} · {topic.label}</div><h1>{topic.title}</h1><p>{topic.summary}</p><div className="lab-topic-tags">{topic.tags.map(tag => <em key={tag}>{tag}</em>)}</div></header>
    <div className="lab-detail-layout"><article className="lab-article">{topic.sections.map(section => <SectionContent section={section} key={section.title}/>)}<section className="lab-checklist"><h2><CheckCircle2 size={20}/>本主题行动清单</h2><ul>{topic.checklist.map(item => <li key={item}>{item}</li>)}</ul></section></article><aside className="lab-aside"><div className="lab-aside-label">同组主题</div><nav>{siblingTopics.map(item => <button type="button" className={item.key === topic.key ? 'active' : ''} onClick={() => onView(`lab:${item.key}`)} key={item.key}>{item.label}<ArrowRight size={15}/></button>)}</nav><div className="lab-aside-note"><ShieldCheck size={18}/><p>这里的分数、数量和节奏是内部实验工具，不是市场成功保证。</p></div></aside></div>
  </div>;
}
