import React from 'react';
import {ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, Layers3, ShieldCheck} from 'lucide-react';
import {hotspotGroups, groupForKey, topicForKey, topicsForGroup} from './hotspotData';
import {groupIcons} from './hotspotIcons';

const platformUrls = {
  Cursor: 'https://www.cursor.com/',
  ChatGPT: 'https://chatgpt.com/',
  'React Native': 'https://reactnative.dev/',
  Firebase: 'https://firebase.google.com/',
  Discord: 'https://discord.com/',
  Nitro: 'https://discord.com/nitro',
  Vercel: 'https://vercel.com/',
  'Unity Asset Store': 'https://assetstore.unity.com/',
  'GameDev Market': 'https://gamedevmarket.net/',
  Fiverr: 'https://www.fiverr.com/',
  Upwork: 'https://www.upwork.com/'
};
const platformPattern = new RegExp(`(${Object.keys(platformUrls).sort((a, b) => b.length - a.length).join('|')})`, 'g');

function linkifyPlatformCell(cell) {
  if (typeof cell !== 'string') return cell;
  return cell.split(platformPattern).map((part, index) => platformUrls[part]
    ? <a href={platformUrls[part]} target="_blank" rel="noreferrer" key={`${part}-${index}`}>{part}</a>
    : part);
}

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
    {section.table && <div className="lab-table-wrap" role="region" aria-label={`${section.title}表格`} tabIndex="0"><table><thead><tr>{section.table.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead><tbody>{section.table.rows.map(row => <tr key={row[0]}>{row.map((cell, index) => index === 0 ? <th scope="row" key={index}>{cell}</th> : <td key={index}>{linkifyPlatformCell(cell)}</td>)}</tr>)}</tbody></table></div>}
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
    {group.key === 'philosophy' && <section className="lab-playable" aria-label="已选方向试玩"><div><span>已选方向 · 完整比赛原型</span><h2>天庭考核：今日宜飞升</h2><p>三科益智考核串起一桩封神榜缺页案：路线诱导、真假口供、取子博弈，最后把卷宗摆上公开听证。</p></div><div className="lab-playable-actions"><a className="primary" href={`${import.meta.env.BASE_URL}play/heavenly-exam/`}>进入天庭考核<ArrowRight size={17}/></a><a className="secondary" href={`${import.meta.env.BASE_URL}play/no-fighting/match.html`}>旧版完整擂台</a><a className="secondary" href={`${import.meta.env.BASE_URL}play/no-fighting/`}>教学关</a></div></section>}
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
    {topic.key === 'wulin-fun-games' && <section className="lab-playable" aria-label="弹指神通试玩入口"><div><span>技术验证 · 首个完整赛事</span><h2>逍遥派·弹指神通</h2><p>拖拽蓄力，击穿木架，砸落逍遥旗。单场 30–60 秒，NPC 观众可以随时关闭。</p></div><div className="lab-playable-actions"><button type="button" className="primary" onClick={() => onView('game')}>进入试玩<ArrowRight size={17}/></button></div></section>}
    {contents.length > 0 && <nav className="lab-group-jump" aria-label="本页目录">{contents.map(item => <button type="button" key={item.sectionTitle} onClick={() => jumpToSection(item.index)}>{item.label}</button>)}</nav>}
    <div className="lab-detail-layout"><article className="lab-article">{topic.sections.map((section, index) => <SectionContent section={section} id={`${topic.key}-section-${index}`} key={section.title}/>)}<section className="lab-checklist"><h2><CheckCircle2 size={20}/>本主题行动清单</h2><ul>{topic.checklist.map(item => <li key={item}>{item}</li>)}</ul></section></article><aside className="lab-aside"><div className="lab-aside-label">同组主题</div><nav>{siblingTopics.map(item => <button type="button" className={item.key === topic.key ? 'active' : ''} onClick={() => onView(`lab:${item.key}`)} key={item.key}>{item.label}<ArrowRight size={15}/></button>)}</nav>{contents.length > 0 && <><div className="lab-aside-label lab-contents-label">本页目录</div><nav aria-label="侧栏本页目录">{contents.map(item => <button type="button" key={item.sectionTitle} onClick={() => jumpToSection(item.index)}>{item.label}</button>)}</nav></>}<div className="lab-aside-note"><ShieldCheck size={18}/><p>这里的分数、数量和节奏是内部实验工具，不是市场成功保证。</p></div></aside></div>
  </div>;
}
