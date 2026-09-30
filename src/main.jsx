import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Menu,ChevronRight,Download,FilePenLine,Check,AlertCircle,X,Plus} from 'lucide-react';
import {Sidebar,GameDetail,LibraryView,TemplateView,StudioGuide,Editor,ConfirmDialog,studioModules} from './components';
import {STORAGE_KEY,loadLibrary,blankRecord,backup,parseBackup,mergeRecords,download,markdown} from './model';
import {hydrateAttachments,removeUnreferencedAttachments,storeRecordAttachments,withoutAttachmentData} from './attachmentStore';
import './styles.css';

import KnowledgeView from './KnowledgeView';
import PlanView from './PlanView';
import HotspotLab from './HotspotLab';
import {groupForKey, topicForKey} from './hotspotData';
import {knowledgeNotes} from './knowledge';
import './knowledge.css';
import './plan.css';
import './hotspotLab.css';
import './taste-overrides.css';
const WulinGame = React.lazy(() => import('./WulinGame'));

function viewFromHash(hash) {
 const value=hash.replace(/^#/,'');
 if(value==='plan') return 'plan';
 if(value==='lab') return 'lab';
 if(value==='play/wulin') return 'game';
 if(value.startsWith('lab/')){let key='';try{key=decodeURIComponent(value.slice(4));}catch{return 'lab';}return topicForKey(key)||groupForKey(key)?`lab:${key}`:'lab';}
 return null;
}

function hashForView(view) {
 if(view==='plan') return '#plan';
 if(view==='lab') return '#lab';
 if(view==='game') return '#play/wulin';
 if(view.startsWith('lab:')&&(topicForKey(view.slice(4))||groupForKey(view.slice(4)))) return `#lab/${encodeURIComponent(view.slice(4))}`;
 return '';
}

function App(){
 const [initial]=useState(loadLibrary);const [records,setRecords]=useState(initial.records);const [error,setError]=useState(initial.error);
 const [view,setView]=useState(viewFromHash(window.location.hash)|| (initial.records.length?'detail':'library'));const [activeId,setActiveId]=useState(initial.records[0]?.id);const [editing,setEditing]=useState(null);const [dirty,setDirty]=useState(false);const [mobile,setMobile]=useState(false);const [toast,setToast]=useState('');const [confirm,setConfirm]=useState(null);const fileInput=useRef(null);
 const record=records.find(r=>r.id===activeId);
 useEffect(()=>{let active=true;(async()=>{try{const hydrated=await hydrateAttachments(initial.records);if(!active)return;setRecords(hydrated);localStorage.setItem(STORAGE_KEY,backup(withoutAttachmentData(hydrated)));await removeUnreferencedAttachments(hydrated);}catch{if(active)setError(current=>current||'附件存储不可用，请导出备份后再继续编辑。');}})();return()=>{active=false;};},[initial.records]);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(t);},[toast]);
 useEffect(()=>{const handler=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty]);
 useEffect(()=>{const syncRoute=()=>{const route=viewFromHash(window.location.hash);if(route){setView(route);setEditing(null);setMobile(false);}else setView(current=>current==='plan'||current==='lab'||current.startsWith('lab:')?'library':current);};window.addEventListener('hashchange',syncRoute);window.addEventListener('popstate',syncRoute);return()=>{window.removeEventListener('hashchange',syncRoute);window.removeEventListener('popstate',syncRoute);};},[]);
 function updatePlanUrl(v){const hash=hashForView(v);if(window.location.hash===hash)return;if(hash)window.location.hash=hash;else{const url=new URL(window.location.href);url.hash='';window.history.pushState(null,'',url);}}
 async function persist(next){if(initial.error&&error){setToast('请先导出原始数据并修复备份，避免覆盖现有资料。');return false;}try{await storeRecordAttachments(next);localStorage.setItem(STORAGE_KEY,backup(withoutAttachmentData(next)));await removeUnreferencedAttachments(next);setRecords(next);setError('');return true;}catch{setError('保存失败：附件存储空间不足或不可用。请保留当前编辑内容，并导出备份。');return false;}}
 function navigate(action){if(dirty){setConfirm({title:'放弃未保存的修改？',body:'这次编辑尚未保存。返回继续编辑，或放弃修改后离开。',confirmLabel:'放弃修改',danger:true,onConfirm:()=>{setDirty(false);setEditing(null);setConfirm(null);action();}});}else action();}
 function changeView(v){navigate(()=>{updatePlanUrl(v);setView(v);setEditing(null);setMobile(false);window.scrollTo(0,0);});}
 function select(id){navigate(()=>{updatePlanUrl('detail');setActiveId(id);setView('detail');setEditing(null);setMobile(false);window.scrollTo(0,0);});}
 function create(kind){navigate(()=>{updatePlanUrl('editor');setEditing({record:blankRecord(kind==='analysis'?'analysis':'note'),isNew:true});setView('editor');setMobile(false);setDirty(false);window.scrollTo(0,0);});}
 function edit(){setEditing({record:structuredClone(record),isNew:false});setView('editor');setDirty(false);window.scrollTo(0,0);}
 async function save(draft){const next=editing.isNew?[draft,...records]:records.map(r=>r.id===draft.id?draft:r);if(await persist(next)){setActiveId(draft.id);setView('detail');setEditing(null);setDirty(false);setToast((draft.kind==='note'?'笔记':'分析')+'已保存到当前浏览器');window.scrollTo(0,0);}}
 function exportAll(){if(initial.error&&error){download(localStorage.getItem(STORAGE_KEY)||'','游戏拆解室-原始数据.txt','text/plain');return;}download(backup(records),'游戏拆解室-备份-'+new Date().toISOString().slice(0,10)+'.json');setToast('备份已导出，包含全部笔记与分析');}
 async function importFile(e){const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>100*1024*1024){setToast('备份文件不能超过 100 MB');return;}try{const incoming=parseBackup(await file.text());setConfirm({title:`导入 ${incoming.length} 条内容？`,body:'导入会合并到现有资料；同一编号内容有变化时保留为另一篇，不覆盖已有内容。',confirmLabel:'合并导入',onConfirm:async()=>{const result=mergeRecords(records,incoming);if(initial.error&&error){setToast('原始资料读取失败，请先导出原始数据后恢复。');setConfirm(null);return;}if(await persist(result.records)){setToast(`已导入 ${result.added} 篇，跳过 ${result.skipped} 篇相同内容`);setConfirm(null);changeView('library');}}});}catch(err){setToast('导入失败：'+err.message);}}
 function remove(){setConfirm({title:`删除“${record.title}”？`,body:'这条内容将从当前浏览器移除。你可以先导出备份。删除后可通过提示中的“撤销”恢复。',confirmLabel:'删除',danger:true,onConfirm:async()=>{const removed=record;if(await persist(records.filter(r=>r.id!==record.id))){setView('library');setToast('内容已删除');setUndo(removed);}setConfirm(null);}});}
 const [undo,setUndo]=useState(null);
 async function duplicate(){const copied={...structuredClone(record),id:crypto.randomUUID(),title:record.title+'（副本）',status:'草稿',updatedAt:new Date().toISOString()};if(await persist([copied,...records])){select(copied.id);setToast('已复制为一篇新草稿');}}
 useEffect(()=>{function key(e){const target=e.target;if(target instanceof HTMLElement&&(target.matches('input,textarea,select')||target.isContentEditable))return;if(e.key.toLowerCase()==='n'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();create();}}window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 const note=knowledgeNotes.find(item=>item.key===view);
 const studioTitle=note?.title||studioModules.find(item=>item.key===view)?.title;
 const labTopic=view.startsWith('lab:')?topicForKey(view.slice(4)):null;
 const labGroup=groupForKey(labTopic?.group||(view.startsWith('lab:')?view.slice(4):null));
 const viewTitle=view==='detail'?record?.title:view==='editor'?(editing?.record.kind==='note'?(editing.isNew?'新建笔记':'编辑笔记'):'编辑分析'):view==='plan'?'90天打卡':labGroup?labGroup.title:view==='lab'?'游戏设计模块':studioTitle||(view==='template'?'分析模板':view==='favorites'?'我的收藏':view==='drafts'?'草稿':'全部内容');
 if(view==='game') return <React.Suspense fallback={<div style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#151127',color:'#f7d58b',fontFamily:'serif'}}>正在铺开逍遥擂台…</div>}><WulinGame onExit={()=>changeView('lab:wulin-fun-games')}/></React.Suspense>;
 return <div className="app"><Sidebar records={records} view={view} activeId={activeId} onView={changeView} onSelect={select} onNew={create} onImport={()=>fileInput.current.click()} onExport={exportAll} mobile={mobile} onClose={()=>setMobile(false)}/><main className="main"><header className="topbar"><button className="icon-button menu-toggle" aria-label="打开导航" onClick={()=>setMobile(true)}><Menu size={21}/></button><div className="breadcrumbs"><button onClick={()=>changeView('library')}>我的工作台</button><ChevronRight size={14}/><span>{viewTitle}</span></div><div className="topbar-actions">{view==='detail'&&record?<><span className="saved-indicator"><Check size={13}/>已保存</span><button className="secondary export-top" onClick={()=>download(markdown(record),record.title.replace(/[\\/:*?"<>|]/g,'-')+'.md','text/markdown')}><Download size={15}/>导出</button><button className="primary" onClick={edit}><FilePenLine size={15}/>编辑{record.kind==='note'?'笔记':'分析'}</button></>:<span className="topbar-small">个人游戏设计资料库</span>}</div></header>
 {error&&<div role="alert" className="error-banner"><AlertCircle size={18}/><span>{error}</span><button onClick={exportAll}>导出当前资料</button></div>}
 {view==='editor'&&editing?<Editor key={editing.record.id} {...editing} onSave={save} onCancel={()=>navigate(()=>{setEditing(null);setView(record?'detail':'library');})} onDirty={()=>setDirty(true)}/>:view==='plan'?<PlanView onDirtyChange={setDirty}/>:view==='lab'||labTopic||labGroup?<HotspotLab topicKey={labTopic?.key} groupKey={labGroup?.key} onView={changeView}/>:note?<KnowledgeView key={note.key} note={note} onView={changeView}/>:view==='template'?<TemplateView onNew={()=>create('analysis')}/>:studioModules.some(item=>item.key===view)?<StudioGuide mode={view} onToast={setToast} onView={changeView}/>:view==='detail'&&record?<GameDetail record={record} onEdit={edit} onFavorite={async()=>{if(await persist(records.map(r=>r.id===record.id?{...r,favorite:!r.favorite}:r)))setToast(record.favorite?'已取消收藏':'已加入收藏');}} onMarkdown={()=>download(markdown(record),record.title.replace(/[\\/:*?"<>|]/g,'-')+'.md','text/markdown')} onDelete={remove} onDuplicate={duplicate}/>:<LibraryView key={view} records={records} mode={view} onSelect={select} onNew={create}/>}
 <input ref={fileInput} type="file" accept=".json,application/json" hidden aria-label="导入备份文件" onChange={importFile}/></main>{toast&&<div className="toast" role="status"><Check size={17}/><span>{toast}</span>{undo&&toast==='内容已删除'&&<button onClick={async()=>{if(await persist([undo,...records])){setUndo(null);setToast('已恢复内容');}}}>撤销</button>}<button aria-label="关闭提示" onClick={()=>setToast('')}><X size={14}/></button></div>}{confirm&&<ConfirmDialog {...confirm} onCancel={()=>setConfirm(null)}/>}</div>;
}
createRoot(document.getElementById('root')).render(<App/>);
