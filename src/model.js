export const STORAGE_KEY = 'game-notes.library.v1';
export const sections = [
  {id:'core', number:'01', title:'核心赌局', general:'核心玩法', color:'purple', caption:'玩家为什么要做这个决定？', fields:[
    {key:'choice', label:'玩家反复做什么选择？', hint:'写出两个或几个具体动作，避免只写“策略”“探索”等类型词。'},
    {key:'information',label:'知道什么，不知道什么？',hint:'区分公开信息、隐藏信息，以及玩家可以推断的信息。'},
    {key:'stakes',label:'选对赚什么，选错亏什么？',hint:'分别写明收益、损失，以及两者如何影响下一步。'}]},
  {id:'agency',number:'02',title:'操控空间',general:'操控空间',color:'blue',caption:'玩家凭什么改变结果？',fields:[
    {key:'control',label:'玩家怎么主动改变胜算？',hint:'列出道具、资源、操作或谈判，以及它们改变的变量。'},
    {key:'dynamic',label:'为什么不能一直选同一个答案？',hint:'哪些状态不断变化？是否存在重复执行就能赢的固定策略？'}]},
  {id:'replay',number:'03',title:'重玩变化',general:'重玩变化',color:'amber',caption:'下一局为什么还想玩？',fields:[
    {key:'replay',label:'下一局为什么仍然值得玩？',hint:'可能是随机配置、新策略或不同剧情。如果是一次性体验，也直接写明。'}]},
  {id:'mood',number:'04',title:'氛围包装',general:'氛围包装',color:'green',caption:'怎样让选择产生情绪？',fields:[
    {key:'setting',label:'玩家在哪里，与谁互动？',hint:'描述场所、角色关系和玩家在其中的身份。'},
    {key:'feedback',label:'怎样让每次选择有重量？',hint:'声音、动画、节奏、界面与操作反馈，分别怎样配合核心玩法？'}]}
];
export const fieldKeys = sections.flatMap(s=>s.fields.map(f=>f.key));
export const seed = {
  id:'buckshot-roulette', title:'恶魔轮盘', subtitle:'Buckshot Roulette', genre:'概率博弈', tags:['风险决策','资源管理','心理惊悚'], status:'已整理', favorite:true, framework:'gamble',
  summary:'用一个“下一枪打谁”的选择，把信息、生命和行动权变成一场可计算、却无法完全确定的赌局。',
  fields:{
    choice:'下一枪打自己，还是打对手？操作只有一个核心分岔，但每次都要重新判断。',
    information:'知道这一批实弹与空包弹的数量，不知道排列顺序。随着射击与退弹，玩家可以追踪剩余弹药；放大镜能查看当前一发。',
    stakes:'对对手打出实弹，削减其生命；对自己打出空包弹，可以继续行动。对自己打出实弹则伤害自己。生命与行动权共同构成风险和收益。',
    control:'放大镜：获得信息。啤酒：退出当前弹药。手铐：让对手跳过一次行动。手锯：提高下一次实弹射击的伤害。香烟：恢复生命。道具共同围绕信息、弹仓、行动权和生命发挥作用。',
    dynamic:'剩余弹药、双方生命、持有道具与行动权不断变化。相同的枪口选择，在不同局面下可能是冒险，也可能是确定的安全操作；部分已知状态仍会出现明显最优解。',
    replay:'弹药顺序和道具配置让熟悉的规则产生不同局面。玩家会尝试更合理地安排道具、掌握出手时机。重复价值也有边界：当信息足够完整时，部分回合会变成执行计算。',
    setting:'玩家与一个危险的对手隔桌对坐，身处封闭、昏暗的房间。共享的霰弹枪让双方持续影响同一个危险对象。',
    feedback:'金属机械声、取枪与转向的动作，让决定变得具体。短暂的击发前等待延缓结果揭晓，枪声与对手反应迅速兑现后果。观察时允许思考，执行时制造紧张。'
  },
  loop:['看局面','算风险','用道具','做选择','承担后果','局面改变'],
  takeaways:'值得借鉴：少量动作、公开数量与隐藏顺序、能修改核心规则的有限道具。\n不宜照搬：枪械外观与死亡包装。先验证拿掉恐怖氛围后，决策是否仍然有趣。\n设计边界：它的单人核心偏概率与资源调度，不等同于真人之间的复杂识谎。',
  notes:'我的感受：非常精巧，简短巧思，氛围渲染很好。玩法不复杂，有赌徒性质。',
  sources:'基于本次对话的设计分析；范围为单人基础玩法，不涵盖全部扩展道具和多人模式。\nSteam：https://store.steampowered.com/app/2835570/',
  updatedAt:'2026-09-10T08:00:00.000Z'
};
export function blankRecord(){return {id:crypto.randomUUID(),title:'',subtitle:'',genre:'',tags:[],status:'草稿',favorite:false,framework:'general',summary:'',fields:Object.fromEntries(fieldKeys.map(k=>[k,''])),loop:[],takeaways:'',notes:'',sources:'',updatedAt:new Date().toISOString()};}
export function completion(record){return fieldKeys.filter(k=>record.fields[k]?.trim()).length;}
export function normalizeRecord(r){
  if (!r || typeof r !== 'object' || Array.isArray(r)) throw new Error('分析条目格式不正确');
  for (const k of ['id','title','subtitle','genre','summary','takeaways','notes','sources','updatedAt']) if(typeof r[k]!=='string'||r[k].length>100000) throw new Error(`条目字段 ${k} 无效`);
  if(!r.id.trim()||!r.title.trim()) throw new Error('游戏名称和编号不能为空');
  if(!['草稿','已整理'].includes(r.status)||!['general','gamble'].includes(r.framework)||typeof r.favorite!=='boolean') throw new Error('条目状态无效');
  for(const k of ['tags','loop']) if(!Array.isArray(r[k])||r[k].length>50||r[k].some(x=>typeof x!=='string'||x.length>1000)) throw new Error('标签或循环步骤格式不正确');
  if(!r.fields||fieldKeys.some(k=>typeof r.fields[k]!=='string'||r.fields[k].length>100000)) throw new Error('分析框架缺少字段');
  if(!Number.isFinite(Date.parse(r.updatedAt))) throw new Error('更新时间无效');
  return Object.fromEntries(['id','title','subtitle','genre','summary','takeaways','notes','sources','updatedAt','status','framework','favorite','tags','loop','fields'].map(k=>[k,k==='fields'?Object.fromEntries(fieldKeys.map(f=>[f,r.fields[f]])):r[k]]));
}
export function parseBackup(text){
  let value;try{value=JSON.parse(text);}catch{throw new Error('文件不是有效的 JSON 备份');}
  if(value?.version!==1||!Array.isArray(value.records)||value.records.length>5000) throw new Error('不支持的备份格式或版本');
  const records=value.records.map(normalizeRecord);if(new Set(records.map(r=>r.id)).size!==records.length) throw new Error('备份存在重复编号');return records;
}
export function backup(records){return JSON.stringify({version:1,exportedAt:new Date().toISOString(),records},null,2);}
export function mergeRecords(existing,incoming,newId=()=>crypto.randomUUID()){
  const result=[...existing];let added=0,skipped=0;
  for(const record of incoming){const found=result.find(r=>r.id===record.id);if(found&&JSON.stringify(normalizeRecord(found))===JSON.stringify(normalizeRecord(record))){skipped++;continue;}result.push({...record,id:found?newId():record.id});added++;}
  return {records:result,added,skipped};
}
export function loadLibrary(){
  try{const text=localStorage.getItem(STORAGE_KEY);return {records:text?parseBackup(text):[structuredClone(seed)],error:''};}
  catch(error){return {records:[],error:'本地资料暂时无法读取。原数据未被覆盖，请先导出原始数据，或导入有效备份。'};}
}
export function markdown(r){return `# ${r.title}${r.subtitle?' · '+r.subtitle:''}\n\n${r.summary}\n\n`+sections.map(s=>`## ${s.number} ${r.framework==='gamble'?s.title:s.general}\n\n`+s.fields.map(f=>`### ${f.label}\n\n${r.fields[f.key]||'待填写'}\n`).join('\n')).join('\n')+`\n## 核心循环\n\n${r.loop.join(' → ')||'待填写'}\n\n## 借鉴清单\n\n${r.takeaways}\n\n## 游玩笔记\n\n${r.notes}\n\n## 资料来源\n\n${r.sources}\n`;}
export function download(text,name,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type:type+';charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
