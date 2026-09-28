import React from 'react';
import {ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, Layers3, ShieldCheck} from 'lucide-react';
import {hotspotGroups, groupForKey, topicForKey, topicsForGroup} from './hotspotData';
import {groupIcons} from './hotspotIcons';

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

function SectionContent({section, id}) {
  return <section className="lab-article-section" id={id} tabIndex={-1}>
    <h2>{section.title}</h2>
    {section.callout && <blockquote>{section.callout.split('\n').map((line, index) => <span key={line}>{index > 0 && <br/>}{line}</span>)}</blockquote>}
    {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
    {section.bullets && <ul>{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
    {section.steps && <ol className="lab-steps">{section.steps.map((step, index) => <li key={step.label}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{step.label}</strong><p>{step.body}</p></div></li>)}</ol>}
    {section.table && <div className="lab-table-wrap" role="region" aria-label={`${section.title}表格`} tabIndex="0"><table><thead><tr>{section.table.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{section.table.rows.map(row => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={index}>{cell}</th> : <td key={index}>{cell}</td>)}</tr>)}</tbody></table></div>}
  </section>;
}

export default function HotspotLab({topicKey, groupKey, onView}) {
  const topic = topicForKey(topicKey);
  if (topic) return <TopicDetail topic={topic} onView={onView}/>;
  const group = groupForKey(groupKey);
  if (group) return <GroupOverview group={group} onView={onView}/>;
  return <Overview onView={onView}/>;
}

function Overview({onView}) {
  return <div className="lab-module">
    <header className="lab-header">
      <div className="lab-eyebrow"><Layers3 size={16}/>模块目录</div>
      <h1>游戏设计模块</h1>
      <p>从左侧栏直接打开一个模块，或在这里选择要阅读的内容。</p>
    </header>
    <div className="lab-topic-grid lab-module-grid">{hotspotGroups.map(group => {
      const Icon = groupIcons[group.key];
      return <button type="button" className="lab-topic-card" key={group.key} onClick={() => onView(`lab:${group.key}`)}>
        <span className="lab-topic-card-top"><Icon size={21}/><ArrowRight size={18}/></span>
        <strong>{group.title}</strong><p>{group.description}</p>
        <span className="lab-topic-tags"><em>{topicsForGroup(group.key).length} 个主题</em></span>
      </button>;
    })}</div>
  </div>;
}

function GroupOverview({group, onView}) {
  const Icon = groupIcons[group.key];
  return <div className="lab-module">
    <header className="lab-header">
      <div className="lab-eyebrow"><Icon size={16}/>独立模块</div>
      <h1>{group.title}</h1><p>{group.description}</p>
    </header>
    {group.key === 'philosophy' && <section className="lab-playable" aria-label="已选方向试玩"><div><span>已选方向 · 首个可玩原型</span><h2>天下第一，禁止动武</h2><p>第一局「请君出圈」：用两面请战旗，引高手自己走出界线。支持点击、触屏、推演与重试。</p></div><a className="primary" href={`${import.meta.env.BASE_URL}play/no-fighting/`}>开始试玩<ArrowRight size={17}/></a></section>}
    <section aria-label={`${group.title}主题`} className="lab-module-topics">
      <div className="lab-topic-grid">{topicsForGroup(group.key).map(topic => <TopicCard topic={topic} onOpen={key => onView(`lab:${key}`)} key={topic.key}/>)}</div>
    </section>
    <footer className="lab-footer"><button type="button" className="lab-back" onClick={() => onView('lab')}><ArrowLeft size={17}/>全部模块</button><button type="button" className="primary" onClick={() => onView('plan')}><CalendarClock size={16}/>90天打卡<ArrowRight size={16}/></button></footer>
  </div>;
}

function TopicDetail({topic, onView}) {
  const group = hotspotGroups.find(item => item.key === topic.group);
  const siblingTopics = topicsForGroup(topic.group);
  const Icon = groupIcons[topic.group];
  const contents = (topic.contents ?? []).map(item => ({...item, index: topic.sections.findIndex(section => section.title === item.sectionTitle)})).filter(item => item.index >= 0);
  const jumpToSection = index => {
    const section = document.getElementById(`${topic.key}-section-${index}`);
    section?.focus({preventScroll: true});
    section?.scrollIntoView({behavior: 'instant', block: 'start'});
  };
  return <div className="lab-module lab-detail">
    <button type="button" className="lab-back" onClick={() => onView(`lab:${group.key}`)}><ArrowLeft size={17}/>返回{group.title}</button>
    <header className="lab-detail-header"><div className="lab-eyebrow"><Icon size={16}/>{group.number} / {group.title} · {topic.label}</div><h1>{topic.title}</h1><p>{topic.summary}</p><div className="lab-topic-tags">{topic.tags.map(tag => <em key={tag}>{tag}</em>)}</div></header>
    {contents.length > 0 && <nav className="lab-group-jump" aria-label="本页目录">{contents.map(item => <button type="button" key={item.sectionTitle} onClick={() => jumpToSection(item.index)}>{item.label}</button>)}</nav>}
    <div className="lab-detail-layout"><article className="lab-article">{topic.sections.map((section, index) => <SectionContent section={section} id={`${topic.key}-section-${index}`} key={section.title}/>)}<section className="lab-checklist"><h2><CheckCircle2 size={20}/>本主题行动清单</h2><ul>{topic.checklist.map(item => <li key={item}>{item}</li>)}</ul></section></article><aside className="lab-aside"><div className="lab-aside-label">同组主题</div><nav>{siblingTopics.map(item => <button type="button" className={item.key === topic.key ? 'active' : ''} onClick={() => onView(`lab:${item.key}`)} key={item.key}>{item.label}<ArrowRight size={15}/></button>)}</nav>{contents.length > 0 && <><div className="lab-aside-label lab-contents-label">本页目录</div><nav aria-label="侧栏本页目录">{contents.map(item => <button type="button" key={item.sectionTitle} onClick={() => jumpToSection(item.index)}>{item.label}</button>)}</nav></>}<div className="lab-aside-note"><ShieldCheck size={18}/><p>这里的分数、数量和节奏是内部实验工具，不是市场成功保证。</p></div></aside></div>
  </div>;
}
