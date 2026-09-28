// Each argument earns a different concession. Evidence must support that concession.
export const ARGUMENTS = {
  taunt: {
    momentum: 2, fame: -1, insight: 1, title: '依法定胜',
    speech: '“人是我自己走出去的！但插旗也能算赢？把大会条款拿来！”',
    feedback: '他承认自愿出界，却质疑插旗是否合法。观众可以作证，条款可以回应质疑。',
    mood: '不服气 · 要求查规则', required: ['rule', 'witness'],
    promise: '他尚未承诺服判，不能拿这张当口供。',
    verdict: '条款准许插旗，证人确认无人推搡。裁判判你获胜；掌门哼了一声，但收起了申诉。',
    quote: '岳不挪：“好，按你们的规矩，这场算你的！”',
    thought: '法家 · 先把可执行的规则说清楚，再按事实裁断。'
  },
  yield: {
    momentum: 1, fame: 1, insight: 2, title: '借势服人',
    speech: '“哼，敢认！我是自己走的，也没人推我。大家若都看见了，这场就算你赢！”',
    feedback: '你给了他体面。他亲口许诺：只要有人作证，就认输。',
    mood: '松口 · 愿意听证人', required: ['witness', 'promise'],
    promise: '“大家若都看见了，这场就算你赢。”',
    verdict: '证人证实他自愿出界，录下的承诺又是他亲口所说。掌门拱手认输，观众为你喝彩。',
    quote: '岳不挪：“没动手，倒让我心服。下一场再会！”',
    thought: '道家 · 顺着对手在意的事借势；退一步，给对方自己行动的空间。'
  },
  ritual: {
    momentum: 1, fame: 2, insight: 0, title: '以礼成局',
    speech: '“你肯依礼，我也不赖账。只要条款准许插旗，老夫便认这场胜负！”',
    feedback: '你先行礼，他给出有条件的承诺。拿出条款，再请他履约。',
    mood: '回礼 · 等待查验条款', required: ['rule', 'promise'],
    promise: '“只要条款准许插旗，老夫便认这场胜负。”',
    verdict: '条款满足了承诺的条件。双方依礼签认，裁判落印；观众赞你赢得有分寸。',
    quote: '岳不挪：“一言既出，自当践行。承让！”',
    thought: '儒家 · 以礼给彼此体面，以信让约定落地。'
  }
};

export const EVIDENCE = {
  rule: {name: '大会条款', copy: '第七条：可设请战旗；自愿踏出界线者负。', momentum: 1, fame: 0, insight: 0},
  witness: {name: '观众证词', copy: '“我们看见他自己走过去，没人碰他。”', momentum: 0, fame: 2, insight: 0},
  promise: {name: '掌门承诺', momentum: 0, fame: 0, insight: 2}
};

export function judgeMatch(choice, evidence) {
  const argument = ARGUMENTS[choice];
  if (!argument || evidence.length !== 2 || new Set(evidence).size !== 2 || evidence.some(key => !EVIDENCE[key])) {
    throw new Error('请选择一种话术和两张不同的证据');
  }
  const missing = argument.required.find(key => !evidence.includes(key));
  const settled = !missing;
  const stats = evidence.reduce((sum, key) => ({
    momentum: sum.momentum + EVIDENCE[key].momentum,
    fame: sum.fame + EVIDENCE[key].fame,
    insight: sum.insight + EVIDENCE[key].insight
  }), {momentum: 2 + argument.momentum, fame: argument.fame, insight: argument.insight});
  return {
    settled, missing, stats,
    title: settled ? argument.title : '已出圈，还差一句定论。',
    copy: settled ? argument.verdict : `裁判暂缓落印：${choice === 'taunt' && evidence.includes('promise') ? '掌门还没有许诺服判，不能替他说过的话作证。' : '你的证据还没有回应掌门刚才的条件。'}补上「${EVIDENCE[missing].name}」，便能说清这一局。`,
    quote: settled ? argument.quote : '裁判：“先别急着散场，可以重新举证。”',
    thought: argument.thought
  };
}
