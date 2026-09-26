import React from 'react';
import MarkdownIt from 'markdown-it';
import plan from './plan.md?raw';

const weeks = Array.from({length: 12}, (_, index) => ({
  id: `plan-week-${index + 1}`,
  label: `第${index + 1}周`
}));
weeks.push({id: 'plan-last', label: '最后6天'});

const markdown = new MarkdownIt({html: false, linkify: false});
markdown.renderer.rules.table_open = (tokens, index, options, env, renderer) => {
  const daily = tokens[index].meta?.daily;
  return `<div class="${daily ? 'plan-day-table' : 'knowledge-table-wrap'}" role="region" aria-label="${daily ? '每日任务' : '计划对照表'}" tabindex="0">${renderer.renderToken(tokens, index, options)}`;
};
markdown.renderer.rules.table_close = (tokens, index, options, env, renderer) => `${renderer.renderToken(tokens, index, options)}</div>`;

const tokens = markdown.parse(plan, {});
for (let index = 0; index < tokens.length; index++) {
  const token = tokens[index];
  if (token.type === 'heading_open') {
    const title = tokens[index + 1].content;
    const week = token.tag === 'h3' ? title.match(/第(\d+)周/) : null;
    const id = week ? `plan-week-${week[1]}` : token.tag === 'h3' && title.startsWith('最后6天') ? 'plan-last'
      : token.tag === 'h2' && title.startsWith('五、') ? 'plan-schedule'
      : token.tag === 'h2' && title.startsWith('六、') ? 'plan-decisions' : null;
    if (id) token.attrSet('id', id);
  }
  if (token.type === 'table_open') {
    const end = tokens.findIndex((item, offset) => offset > index && item.type === 'table_close');
    token.meta = {daily: tokens.slice(index + 1, end).some(item => item.type === 'inline' && /^D\d{2}$/.test(item.content))};
  }
}
const firstSection = tokens.findIndex(token => token.type === 'heading_open' && token.tag === 'h2');
const introduction = markdown.renderer.render(tokens.slice(0, firstSection), markdown.options, {});
const sections = markdown.renderer.render(tokens.slice(firstSection), markdown.options, {});

function WeekNavigation() {
  return <nav className="plan-week-nav" aria-label="计划周次">
    {weeks.map(({id, label}) => <button type="button" key={id} onClick={() => document.getElementById(id)?.scrollIntoView({behavior: 'instant', block: 'start'})}>{label}</button>)}
  </nav>;
}

export default function PlanView({onView}) {
  return <article className="plan-page">
    <header className="plan-page-nav"><button type="button" className="guide-link-button" onClick={() => onView('guide')}>返回工作室指南</button>
      <span>单人开发 / 游戏与内容 / 90天</span>
    </header>
    <div className="plan-content">
      <div dangerouslySetInnerHTML={{__html: introduction}}/>
      <WeekNavigation/>
      <div dangerouslySetInnerHTML={{__html: sections}}/>
    </div>
    <footer className="plan-footer"><button type="button" className="guide-link-button" onClick={() => onView('guide')}>返回工作室指南</button></footer>
  </article>;
}
