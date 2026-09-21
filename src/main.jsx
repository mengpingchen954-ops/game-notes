import React,{useEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Menu,ChevronRight,Download,FilePenLine,Check,AlertCircle,X,Plus} from 'lucide-react';
import {Sidebar,GameDetail,LibraryView,TemplateView,StudioGuide,Editor,ConfirmDialog,studioModules} from './components';
import {STORAGE_KEY,loadLibrary,blankRecord,backup,parseBackup,mergeRecords,download,markdown} from './model';
import './styles.css';

import KnowledgeView from './KnowledgeView';
import {knowledgeNotes} from './knowledge';
import './knowledge.css';
import './taste-overrides.css';

function App(){
 const [initial]=useState(loadLibrary);const [records,setRecords]=useState(initial.records);const [error,setError]=useState(initial.error);
 const [view,setView]=useState(initial.records.length?'detail':'library');const [activeId,setActiveId]=useState(initial.records[0]?.id);const [editing,setEditing]=useState(null);const [dirty,setDirty]=useState(false);const [mobile,setMobile]=useState(false);const [toast,setToast]=useState('');const [confirm,setConfirm]=useState(null);const fileInput=useRef(null);
 const record=records.find(r=>r.id===activeId);
 useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),4500);return()=>clearTimeout(t);},[toast]);
 useEffect(()=>{const handler=e=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',handler);return()=>window.removeEventListener('beforeunload',handler);},[dirty]);
 function persist(next){if(initial.error&&error){setToast('请先导出原始数据并修复备份，避免覆盖现有资料。');return false;}try{localStorage.setItem(STORAGE_KEY,backup(next));setRecords(next);setError('');return true;}catch{setError('保存失败：浏览器存储空间不足或不可用。请保留当前编辑内容，并导出备份。');return false;}}
 function navigate(action){if(dirty){setConfirm({title:'放弃未保存的修改？',body:'这次编辑尚未保存。返回继续编辑，或放弃修改后离开。',confirmLabel:'放弃修改',danger:true,onConfirm:()=>{setDirty(false);setEditing(null);setConfirm(null);action();}});}else action();}
 function changeView(v){navigate(()=>{setView(v);setEditing(null);setMobile(false);window.scrollTo(0,0);});}
 function select(id){navigate(()=>{setActiveId(id);setView('detail');setEditing(null);setMobile(false);window.scrollTo(0,0);});}
 function create(){navigate(()=>{setEditing({record:blankRecord(),isNew:true});setView('editor');setMobile(false);setDirty(false);window.scrollTo(0,0);});}
 function edit(){setEditing({record:structuredClone(record),isNew:false});setView('editor');setDirty(false);window.scrollTo(0,0);}
 function save(draft){const next=editing.isNew?[draft,...records]:records.map(r=>r.id===draft.id?draft:r);if(persist(next)){setActiveId(draft.id);setView('detail');setEditing(null);setDirty(false);setToast('分析已保存到当前浏览器');window.scrollTo(0,0);}}
 function exportAll(){if(initial.error&&error){download(localStorage.getItem(STORAGE_KEY)||'','游戏拆解室-原始数据.txt','text/plain');return;}download(backup(records),'游戏拆解室-备份-'+new Date().toISOString().slice(0,10)+'.json');setToast('备份已导出，包含全部分析');}
 async function importFile(e){const file=e.target.files?.[0];e.target.value='';if(!file)return;if(file.size>20*1024*1024){setToast('备份文件不能超过 20 MB');return;}try{const incoming=parseBackup(await file.text());setConfirm({title:`导入 ${incoming.length} 篇分析？`,body:'导入会合并到现有资料；同一编号内容有变化时保留为另一篇，不覆盖已有内容。',confirmLabel:'合并导入',onConfirm:()=>{const result=mergeRecords(records,incoming);if(initial.error&&error){setToast('原始资料读取失败，请先导出原始数据后恢复。');setConfirm(null);return;}if(persist(result.records)){setToast(`已导入 ${result.added} 篇，跳过 ${result.skipped} 篇相同内容`);setConfirm(null);changeView('library');}}});}catch(err){setToast('导入失败：'+err.message);}}
 function remove(){setConfirm({title:`删除“${record.title}”？`,body:'这篇分析将从当前浏览器移除。你可以先导出备份。删除后可通过提示中的“撤销”恢复。',confirmLabel:'删除分析',danger:true,onConfirm:()=>{const removed=record;if(persist(records.filter(r=>r.id!==record.id))){setView('library');setToast('分析已删除');setUndo(removed);}setConfirm(null);}});}
 const [undo,setUndo]=useState(null);
 function duplicate(){const copied={...structuredClone(record),id:crypto.randomUUID(),title:record.title+'（副本）',status:'草稿',updatedAt:new Date().toISOString()};if(persist([copied,...records])){select(copied.id);setToast('已复制为一篇新草稿');}}
 useEffect(()=>{function key(e){const target=e.target;if(target instanceof HTMLElement&&(target.matches('input,textarea,select')||target.isContentEditable))return;if(e.key.toLowerCase()==='n'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){e.preventDefault();create();}}window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key);});
 const note=knowledgeNotes.find(item=>item.key===view);
 const studioTitle=note?.title||studioModules.find(item=>item.key===view)?.title;
 const viewTitle=view==='detail'?record?.title:view==='editor'?'编辑分析':studioTitle||(view==='template'?'分析模板':view==='favorites'?'我的收藏':view==='drafts'?'分析草稿':'全部分析');
 return <div className="app"><Sidebar records={records} view={view} activeId={activeId} onView={changeView} onSelect={select} onNew={create} onImport={()=>fileInput.current.click()} onExport={exportAll} mobile={mobile} onClose={()=>setMobile(false)}/><main className="main"><header className="topbar"><button className="icon-button menu-toggle" aria-label="打开导航" onClick={()=>setMobile(true)}><Menu size={21}/></button><div className="breadcrumbs"><button onClick={()=>changeView('library')}>我的工作台</button><ChevronRight size={14}/><span>{viewTitle}</span></div><div className="topbar-actions">{view==='detail'&&record?<><span className="saved-indicator"><Check size={13}/>已保存</span><button className="secondary export-top" onClick={()=>download(markdown(record),record.title.replace(/[\\/:*?"<>|]/g,'-')+'.md','text/markdown')}><Download size={15}/>导出</button><button className="primary" onClick={edit}><FilePenLine size={15}/>编辑分析</button></>:<span className="topbar-small">个人游戏设计资料库</span>}</div></header>
 {error&&<div role="alert" className="error-banner"><AlertCircle size={18}/><span>{error}</span><button onClick={exportAll}>导出当前资料</button></div>}
 {view==='editor'&&editing?<Editor key={editing.record.id} {...editing} onSave={save} onCancel={()=>navigate(()=>{setEditing(null);setView(record?'detail':'library');})} onDirty={()=>setDirty(true)}/>:note?<KnowledgeView key={note.key} note={note} onView={changeView}/>:view==='template'?<TemplateView onNew={create}/>:studioModules.some(item=>item.key===view)?<StudioGuide mode={view} onToast={setToast} onView={changeView}/>:view==='detail'&&record?<GameDetail record={record} onEdit={edit} onFavorite={()=>{if(persist(records.map(r=>r.id===record.id?{...r,favorite:!r.favorite}:r)))setToast(record.favorite?'已取消收藏':'已加入收藏');}} onMarkdown={()=>download(markdown(record),record.title.replace(/[\\/:*?"<>|]/g,'-')+'.md','text/markdown')} onDelete={remove} onDuplicate={duplicate}/>:<LibraryView key={view} records={records} mode={view} onSelect={select} onNew={create}/>}
 <input ref={fileInput} type="file" accept=".json,application/json" hidden aria-label="导入备份文件" onChange={importFile}/></main>{toast&&<div className="toast" role="status"><Check size={17}/><span>{toast}</span>{undo&&toast==='分析已删除'&&<button onClick={()=>{if(persist([undo,...records])){setUndo(null);setToast('已恢复分析');}}}>撤销</button>}<button aria-label="关闭提示" onClick={()=>setToast('')}><X size={14}/></button></div>}{confirm&&<ConfirmDialog {...confirm} onCancel={()=>setConfirm(null)}/>}</div>;
}
createRoot(document.getElementById('root')).render(<App/>);
