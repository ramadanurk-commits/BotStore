'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
import {Copy,Database,RefreshCw,Search,Wrench} from 'lucide-react';
import {Dialog,DialogContent,DialogDescription,DialogTitle} from '@/components/ui/dialog';
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select';
import type {Lang} from '@/lib/catalog';
import {translate} from '@/lib/i18n';
import {toast} from 'sonner';

type API=(path:string,body?:unknown)=>Promise<any>;
type RequestRow={
 id:string;product_id:string|null;tier:string;sector:string;status:string;
 quote:number|null;deadline:string;created_at:number;
 language?:string;name?:string;contact?:string;message?:string;note?:string;updated_at?:number;
};
const statuses=['new','contacted','quoted','in_progress','done','declined'];
const tierKey=(tier:string)=>tier==='support'?'installSupport':tier;
const money=(amount:number)=>new Intl.NumberFormat('ru-RU').format(amount)+' ₸';
const errorKey=(error:unknown)=>error instanceof Error?error.message:'unavailable';
function StatusFilter({value,onChange,lang,all=true}:{value:string;onChange:(value:string)=>void;lang:Lang;all?:boolean}){
 return <Select value={value} onValueChange={onChange}><SelectTrigger className="picker" aria-label={translate(lang,all?'filterStatus':'status')}><SelectValue/></SelectTrigger><SelectContent>{(all?['all',...statuses]:statuses).map(status=><SelectItem key={status} value={status}>{translate(lang,status)}</SelectItem>)}</SelectContent></Select>;
}

function BackendStatus({lang,api}:{lang:Lang;api:API}){
 const [state,setState]=useState<'checking'|'connected'|'unavailable'>('checking');
 const [time,setTime]=useState('');
 const generation=useRef(0);
 const check=useCallback(async()=>{
  const current=++generation.current;setState('checking');
  try{
   const data=await api('health');
   if(data.status!=='ok'||data.database!=='connected'||!Number.isFinite(Date.parse(data.serverTime)))throw new Error('unavailable');
   if(current===generation.current){setTime(data.serverTime);setState('connected');}
  }catch{if(current===generation.current){setTime('');setState('unavailable');}}
 },[api]);
 useEffect(()=>{void check();return()=>{generation.current++;}},[check]);
 const locale=lang==='kk'?'kk-KZ':lang==='ru'?'ru-KZ':'en-GB';
 return <aside className={'backend-status '+state} aria-label={translate(lang,'databaseConnection')}>
  <Database size={20} aria-hidden="true"/>
  <div aria-live="polite"><strong>{translate(lang,state==='checking'?'checkingDatabase':state==='connected'?'databaseConnected':'databaseUnavailable')}</strong>{state==='connected'&&time&&<small>{translate(lang,'checkedAt')} <time dateTime={time}>{new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit',second:'2-digit'}).format(new Date(time))}</time></small>}</div>
  <a href="/api/health" target="_blank" rel="noopener noreferrer" className="text-button">{translate(lang,'openHealth')}</a>
  <button type="button" className="button outline" onClick={()=>void check()} disabled={state==='checking'}><RefreshCw size={16} className={state==='checking'?'spin':''} aria-hidden="true"/>{translate(lang,'checkConnection')}</button>
 </aside>;
}

export function RequestsPanel({lang,api,admin=false}:{lang:Lang;api:API;admin?:boolean}){
 const t=(key:string)=>translate(lang,key);
 const [rows,setRows]=useState<RequestRow[]|null>(null),[status,setStatus]=useState('all');
 const [search,setSearch]=useState(''),[query,setQuery]=useState('');
 const [error,setError]=useState(''),[loading,setLoading]=useState(true);
 const [active,setActive]=useState<RequestRow|null>(null),[busy,setBusy]=useState(false);
 const generation=useRef(0);
 const load=useCallback(async()=>{
  const current=++generation.current;setLoading(true);setError('');
  const params=new URLSearchParams();
  if(admin&&status!=='all')params.set('status',status);
  if(admin&&query)params.set('q',query);
  try{
   const data=await api('service-requests'+(params.size?'?'+params.toString():''));
   if(!Array.isArray(data.requests))throw new Error('unavailable');
   if(current===generation.current)setRows(data.requests);
  }catch(error){if(current===generation.current)setError(errorKey(error));}
  finally{if(current===generation.current)setLoading(false);}
 },[api,admin,status,query]);
 useEffect(()=>{void load();return()=>{generation.current++;}},[load]);
 const submitSearch=()=>{const value=search.trim();if(value===query)void load();else setQuery(value);};
 const clearSearch=()=>{setSearch('');if(query)setQuery('');else void load();};
 return <section className="growth-panel requests-panel">
  {admin&&<BackendStatus lang={lang} api={api}/>}
  <div className="panel-top"><h2><Wrench size={22}/>{t('serviceRequests')}</h2><div className="row-actions">{admin&&<StatusFilter value={status} onChange={setStatus} lang={lang}/>}<button type="button" className="button outline" onClick={()=>void load()} disabled={loading}><RefreshCw size={16} aria-hidden="true"/>{t('refresh')}</button></div></div>
  {admin&&<form className="request-search" role="search" onSubmit={event=>{event.preventDefault();submitSearch();}}><label htmlFor="service-request-search">{t('searchRequests')}<span><Search size={18} aria-hidden="true"/><input id="service-request-search" name="q" type="search" maxLength={100} autoComplete="off" value={search} onChange={event=>setSearch(event.target.value)} placeholder={t('searchRequestsHint')}/></span></label><button className="button" type="submit">{t('findRequests')}</button>{(search||query)&&<button className="button outline" type="button" onClick={clearSearch}>{t('clearSearch')}</button>}</form>}
  <div aria-busy={loading}>
   {error?<p className="notice" role="alert">{t(error)}</p>:loading?<p className="requests-loading">{t('loading')}</p>:!rows?.length?<p className="page-empty panel">{t(admin&&(query||status!=='all')?'noMatchingRequests':'empty')}</p>:<div className="request-list">{rows.map(row=><article key={row.id}><div><span className={'status '+row.status}>{t(row.status)}</span><h3>{t(tierKey(row.tier))} · {t(row.sector)}</h3><div className="request-reference"><code>{row.id.slice(0,8)}</code><small>{new Date(row.created_at).toLocaleDateString()}</small>{admin&&<button type="button" className="text-button" onClick={async()=>{try{await navigator.clipboard.writeText(row.id);toast.success(t('copied'));}catch{toast.error(t('unavailable'));}}}><Copy size={14} aria-hidden="true"/>{t('copyRequestId')}</button>}</div>{admin&&<><p><b>{row.name}</b> · {row.contact}</p><p className="request-message">{row.message}</p></>}{row.quote!==null&&<p>{t('quote')}: <b>{money(row.quote)}</b></p>}{row.deadline&&<p>{t('deadline')}: {row.deadline}</p>}</div>{admin&&<button type="button" className="button outline" onClick={()=>setActive({...row})}>{t('edit')}</button>}</article>)}</div>}
  </div>
  <div className="request-results-meta"><p className="muted">{t(admin&&(query||status!=='all')?'requestSearchLimit':'requestListLimit')}</p>{!error&&!loading&&rows&&<p aria-live="polite">{t('requestsShown')} <b>{rows.length}</b></p>}</div>
  <Dialog open={!!active} onOpenChange={open=>{if(!open&&!busy)setActive(null);}}><DialogContent className="store-dialog" showCloseButton={!busy}><DialogTitle>{t('serviceRequests')}</DialogTitle><DialogDescription>{active?.id}</DialogDescription>{active&&<form className="sub-form" onSubmit={async event=>{event.preventDefault();setBusy(true);try{await api('service-requests/'+active.id,{status:active.status,quote:active.quote,deadline:active.deadline,note:active.note,updated_at:active.updated_at});setActive(null);await load();toast.success(t('saved'));}catch(error){toast.error(t(errorKey(error)));}finally{setBusy(false);}}}><b>{active.name} · {active.contact}</b><p className="request-message">{active.message}</p><p>{t('category')}: {t(active.sector)} · {active.language?.toUpperCase()}{active.product_id?' · '+active.product_id:''}</p><label>{t('status')}<StatusFilter value={active.status} onChange={status=>setActive({...active,status})} lang={lang} all={false}/></label><div className="form-grid"><label>{t('quote')}<input type="number" min={0} max={10000000} step={1} value={active.quote??''} onChange={event=>setActive({...active,quote:event.target.value===''?null:Number(event.target.value)})}/></label><label>{t('deadline')}<input maxLength={100} value={active.deadline} onChange={event=>setActive({...active,deadline:event.target.value})}/></label></div><label>{t('internalNote')}<textarea rows={4} maxLength={3000} value={active.note} onChange={event=>setActive({...active,note:event.target.value})}/></label><p className="notice">{t('noAutoContact')}</p><button className="button" disabled={busy}>{t(busy?'saving':'save')}</button></form>}</DialogContent></Dialog>
 </section>;
}
