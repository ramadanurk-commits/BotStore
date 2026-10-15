'use client';
import {useState} from 'react';
import {Check,Copy,KeyRound,Mail,ShieldCheck} from 'lucide-react';
import type {Lang} from '@/lib/catalog';
import {translate} from '@/lib/i18n';
import {toast} from 'sonner';
type API=(path:string,body?:unknown)=>Promise<any>;
export function EmailAuth({lang,api,onComplete,onGuest,signInHref,linkEmail}:{lang:Lang;api:API;onComplete:()=>void|Promise<void>;onGuest?:()=>void;signInHref?:string;linkEmail?:string}){
 const t=(key:string)=>translate(lang,key);
 const [mode,setMode]=useState<'login'|'register'|'recover'|'link'>(linkEmail?'link':'login');
 const [email,setEmail]=useState(linkEmail||''),[name,setName]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState(''),[recovery,setRecovery]=useState(''),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[code,setCode]=useState(''),[saved,setSaved]=useState(false);
 function changeMode(value:typeof mode){setMode(value);setPassword('');setConfirm('');setRecovery('');setError('');setConsent(false);}
 if(code)return <section className="email-auth recovery-save"><div className="auth-mark"><KeyRound/></div><h3>{t('saveRecoveryCode')}</h3><p>{t('recoveryCodeHint')}</p><code>{code}</code><button className="button outline" type="button" onClick={async()=>{try{await navigator.clipboard.writeText(code);toast.success(t('copied'));}catch{toast.error(t('unavailable'));}}}><Copy size={17}/>{t('copy')}</button><label className="auth-checkbox"><input type="checkbox" checked={saved} onChange={event=>setSaved(event.target.checked)}/>{t('recoveryCodeSaved')}</label><button className="button" type="button" disabled={!saved||busy} onClick={async()=>{setBusy(true);try{setCode('');await onComplete();}finally{setBusy(false);}}}><Check size={18}/>{t('goToAccount')}</button></section>;
 return <section className={'email-auth '+(linkEmail?'link-email-auth':'')}>
  <div className="auth-mark"><Mail/></div><h3>{t(mode==='link'?'linkEmailLogin':mode==='recover'?'recoverAccount':'emailLogin')}</h3>
  {!linkEmail&&mode!=='recover'&&<div className="auth-tabs" role="group" aria-label={t('emailLogin')}><button type="button" disabled={busy} aria-pressed={mode==='login'} onClick={()=>changeMode('login')}>{t('authLogin')}</button><button type="button" disabled={busy} aria-pressed={mode==='register'} onClick={()=>changeMode('register')}>{t('authRegister')}</button></div>}
  <form className="sub-form" onSubmit={async event=>{
   event.preventDefault();setError('');if(mode!=='login'&&password!==confirm){setError('passwordMismatch');return;}
   setBusy(true);try{const result=await api('auth/'+mode,{email,name,password,recoveryCode:recovery,consent});setPassword('');setConfirm('');setRecovery('');if(result.recoveryCode)setCode(result.recoveryCode);else await onComplete();}catch(error){setError(error instanceof Error?error.message:'unavailable');}finally{setBusy(false);}
  }}>
   {mode==='register'&&<label>{t('requestName')}<input required minLength={2} maxLength={100} autoComplete="name" value={name} disabled={busy} onChange={event=>setName(event.target.value)}/></label>}
   <label>Email<input type="email" required maxLength={254} autoComplete="username" value={email} readOnly={!!linkEmail} disabled={busy} onChange={event=>setEmail(event.target.value)}/></label>
   {mode==='recover'&&<label>{t('recoveryCode')}<input required minLength={64} maxLength={64} autoComplete="off" spellCheck={false} value={recovery} disabled={busy} onChange={event=>setRecovery(event.target.value)}/></label>}
   <label>{t(mode==='recover'?'newPassword':'authPassword')}<input type="password" required minLength={mode==='login'?1:15} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} value={password} disabled={busy} onChange={event=>setPassword(event.target.value)}/></label>
   {mode!=='login'&&<><small>{t('passwordPolicy')}</small><label>{t('confirmPassword')}<input type="password" required minLength={15} maxLength={128} autoComplete="new-password" value={confirm} disabled={busy} onChange={event=>setConfirm(event.target.value)}/></label></>}
   {(mode==='register'||mode==='link')&&<><p className="auth-note">{t('emailAccountNotice')}</p><label className="auth-checkbox"><input type="checkbox" required checked={consent} disabled={busy} onChange={event=>setConsent(event.target.checked)}/>{t('authConsent')}</label></>}
   {error&&<p className="notice" role="alert">{t(error)}</p>}
   <button className="button full" disabled={busy}>{t(busy?'loading':mode==='login'?'authLogin':mode==='register'?'authRegister':mode==='link'?'linkEmailLogin':'restoreAccess')}</button>
   {!linkEmail&&<button type="button" className="text-button" disabled={busy} onClick={()=>changeMode(mode==='recover'?'login':'recover')}>{t(mode==='recover'?'backToLogin':'forgotPassword')}</button>}
  </form>
  {!linkEmail&&<><p className="auth-note">{t('existingAccountHint')}</p>{signInHref&&<><div className="auth-divider">{t('authOr')}</div><a className="button outline full" href={signInHref} target="_top"><ShieldCheck size={18}/>{t('loginChatGPT')}</a></>}{onGuest&&<button type="button" className="text-button" onClick={onGuest}>{t('continueGuest')}</button>}</>}
 </section>;
}
