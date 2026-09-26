import React from 'react';
import {ArrowRight, BookOpen} from 'lucide-react';
import {knowledgeNotes} from './knowledge';

export function KnowledgeIndex({onView}) {
  return <section className="knowledge-index" aria-labelledby="knowledge-index-title">
    <h2 id="knowledge-index-title">开发与商业笔记</h2>
    <p>从需求和市场出发，逐步明确受众、玩法与制作方式。</p>
    <div className="knowledge-index-list">{knowledgeNotes.map(note => <button key={note.key} onClick={() => onView(note.key)}>
      <span><strong>{note.label}</strong><small>{note.description}</small></span><ArrowRight size={18}/>
    </button>)}</div>
  </section>;
}

export default function KnowledgeView({note,onView}) {
  return <article className="knowledge-page">
    <header className="knowledge-header">
      <button className="guide-link-button" onClick={() => onView('guide')}>返回工作室指南</button>
      <h1>{note.title}</h1><p>{note.description}</p>
      <small>对话整理 · 2026年9月21日</small>
    </header>
    <div className="knowledge-question"><strong>讨论的问题</strong><p>{note.question}</p></div>
    <div className="knowledge-takeaway"><BookOpen size={20}/><p>{note.takeaway}</p></div>
    <nav className="knowledge-toc" aria-label="本文目录">{note.sections.map((section,i) => <button key={section.title} onClick={() => document.getElementById(`${note.key}-${i}`)?.scrollIntoView({behavior:'smooth',block:'start'})}>{section.title}</button>)}</nav>
    {note.sections.map((section,i) => <section className="knowledge-section" id={`${note.key}-${i}`} key={section.title}>
      <h2><span>{String(i+1).padStart(2,'0')}</span>{section.title}</h2>
      {section.paragraphs?.map(text => <p key={text}>{text}</p>)}
      {section.bullets && <ul>{section.bullets.map(text => <li key={text}>{text}</li>)}</ul>}
      {section.rows && <div className="knowledge-table-wrap" role="region" aria-label={section.title+'对照表'} tabIndex={0}><table>
        <caption>{section.title}</caption>
        <thead><tr>{section.columns.map(column => <th scope="col" key={column}>{column}</th>)}</tr></thead>
        <tbody>{section.rows.map(row => <tr key={row[0]}>{row.map((cell,j) => j===0?<th scope="row" key={j}>{cell}</th>:<td key={j}>{cell}</td>)}</tr>)}</tbody>
      </table></div>}
    </section>)}
    <footer className="knowledge-footer"><p>整理范围：从“游戏公司如何从零起步”到“AI 美术”的讨论。内容为对话观点与行动建议；市场表现、平台政策与具体案例需另行核验。</p>
      <nav aria-label="相关阅读">{note.related.map(key => {const related=knowledgeNotes.find(item => item.key===key);return <button className="secondary" key={key} onClick={() => onView(key)}>{related.label}<ArrowRight size={15}/></button>;})}</nav>
    </footer>
  </article>;
}
