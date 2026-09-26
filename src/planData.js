import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({html: false, linkify: false});
markdown.renderer.rules.table_open = (tokens, index, options, env, renderer) =>
  `<div class="knowledge-table-wrap" role="region" aria-label="计划对照表" tabindex="0">${renderer.renderToken(tokens, index, options)}`;
markdown.renderer.rules.table_close = (tokens, index, options, env, renderer) =>
  `${renderer.renderToken(tokens, index, options)}</div>`;

const render = tokens => markdown.renderer.render(tokens, markdown.options, {});
const headingTitle = (tokens, index) => tokens[index + 1]?.content?.trim() || '';

function readCell(token) {
  if (!token?.children) throw new Error('计划表格中有空白单元格');
  return {
    text: token.children.map(child => child.content || (child.type === 'softbreak' ? ' ' : '')).join('').trim(),
    html: markdown.renderer.renderInline(token.children, markdown.options, {})
  };
}

function readRows(tokens) {
  const start = tokens.findIndex(token => token.type === 'tbody_open');
  const end = tokens.findIndex((token, index) => index > start && token.type === 'tbody_close');
  if (start < 0 || end < 0) throw new Error('计划周次缺少任务表格');

  const rows = [];
  let row = null;
  for (const token of tokens.slice(start + 1, end)) {
    if (token.type === 'tr_open') row = [];
    if (token.type === 'inline' && row) row.push(readCell(token));
    if (token.type === 'tr_close') {
      if (row?.length !== 3) throw new Error('每日任务必须有日号、游戏/选品、内容/验证三列');
      rows.push(row);
      row = null;
    }
  }
  return rows;
}

export function parsePlan(source) {
  const tokens = markdown.parse(source, {});
  const titleIndex = tokens.findIndex(token => token.type === 'heading_open' && token.tag === 'h1');
  const headings = tokens.flatMap((token, index) =>
    token.type === 'heading_open' && token.tag === 'h2' ? [{index, title: headingTitle(tokens, index)}] : []);
  const prefixes = ['一、', '二、', '三、', '四、', '五、', '六、', '七、'];
  if (titleIndex < 0 || headings.length !== prefixes.length ||
      headings.some(({title}, index) => !title.startsWith(prefixes[index]))) {
    throw new Error('计划必须包含标题和完整的七个章节');
  }

  const sections = headings.map(({index}, section) => tokens.slice(index, headings[section + 1]?.index));
  const schedule = sections[4];
  const weekHeadings = schedule.flatMap((token, index) =>
    token.type === 'heading_open' && token.tag === 'h3' ? [{index, title: headingTitle(schedule, index)}] : []);
  if (weekHeadings.length !== 13) throw new Error('每日计划必须包含12周和最后6天');

  const weeks = [];
  const days = [];
  for (const [index, heading] of weekHeadings.entries()) {
    const week = index + 1;
    const titleIsValid = week <= 12 ? heading.title.startsWith(`第${week}周：`) : heading.title.startsWith('最后6天：');
    if (!titleIsValid) throw new Error(`第${week}个周次标题不正确`);

    const weekTokens = schedule.slice(heading.index + 3, weekHeadings[index + 1]?.index);
    const tableStart = weekTokens.findIndex(token => token.type === 'table_open');
    const tableEnd = weekTokens.findIndex((token, offset) => offset > tableStart && token.type === 'table_close');
    if (tableStart < 0 || tableEnd < 0) throw new Error(`${heading.title}缺少任务表格`);
    const rows = readRows(weekTokens.slice(tableStart, tableEnd + 1));
    if (rows.length !== (week === 13 ? 6 : 7)) throw new Error(`${heading.title}的任务天数不完整`);

    const weekDays = rows.map(([day, game, content]) => {
      const match = /^D(\d{2})$/.exec(day.text);
      const number = match && Number(match[1]);
      if (number !== days.length + 1 || !game.text || !content.text) {
        throw new Error(`${heading.title}中的任务编号或内容不完整`);
      }
      const task = {number, id: day.text, week, game, content};
      days.push(task);
      return task;
    });
    weeks.push({number: week, title: heading.title, days: weekDays});
  }

  const introduction = tokens.slice(titleIndex + 3, headings[0].index);
  return {
    title: headingTitle(tokens, titleIndex),
    description: introduction.filter(token => token.type === 'inline').map(token => token.content).join('\n\n'),
    weeks,
    days,
    references: {
      selection: render([...sections[0], ...sections[1]]),
      distribution: render([...sections[2], ...sections[3]]),
      decisions: render([...sections[5], ...sections[6]])
    },
    scheduleIntro: render(schedule.slice(3, weekHeadings[0].index))
  };
}
