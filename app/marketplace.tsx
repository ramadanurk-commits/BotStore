'use client';
import {useState} from 'react';
import {ArrowDown,ArrowUpRight,Bot,Check,CheckCheck,CheckCircle2,ChevronDown,Code2,Gift,Layers,MessageSquare,PanelTop,Play,RotateCcw,Send,Sheet,Sparkles} from 'lucide-react';
import {translate} from '@/lib/i18n';
import type {Lang,Product} from '@/lib/catalog';

export function MarketplaceHero({lang,products,onBrowse,onFind,onOpen}:{lang:Lang;products:Product[];onBrowse:()=>void;onFind:()=>void;onOpen:(product:Product)=>void}){
 const t=(key:string)=>translate(lang,key),[sent,setSent]=useState(false);
 const starter=products.find(p=>p.id==='expense-tracker'&&p.price===0)||products.find(p=>p.price===0);
 return <>
  <section className="market-hero">
   <div className="market-hero-copy">
    <div className="market-kicker"><span aria-hidden="true"/>{t('mKicker')}</div>
    <h1>{t('mTitle')}<br/><span>{t('mAccent')}</span></h1>
    <p className="market-intro">{t('mIntro')}</p>
    <div className="market-actions"><button className="button market-primary" onClick={onBrowse}>{t('mBrowse')}<ArrowUpRight size={19}/></button><button className="button outline" onClick={onFind}><Sparkles size={17}/>{t('mFind')}</button></div>
    <div className="market-proof"><span><Check size={15}/>{t('onepay')}</span><span><Check size={15}/>{t('mSource')}</span></div>
    {starter&&<button className="market-free-link" onClick={()=>onOpen(starter)}><span><Gift size={17}/></span>{t('mFreeStart')}<ArrowUpRight size={16}/></button>}
   </div>
   <div className="automation-scene">
    <div className="scene-orbit" aria-hidden="true"/>
    <div className="scene-window">
     <div className="scene-window-bar"><div aria-hidden="true"><i/><i/><i/></div><span>botstore / assistant</span><span className="scene-demo-label">{t('mDemo')}</span></div>
     <div className="scene-bot-heading"><span className="scene-bot-avatar"><Bot size={25}/></span><div><b>{t('mBotName')}</b><small>Telegram · BotStore</small></div><span className="scene-telegram"><Send size={18}/></span></div>
     <div className="scene-chat">
      <div className="scene-bubble incoming"><small>BOTSTORE BOT</small><p>{t('mBotGreeting')}</p></div>
      <div className="scene-bubble outgoing"><p>{t('mBotMessage')}</p><CheckCheck size={15}/></div>
      <div className={'scene-event '+(sent?'is-sent':'')} role="status" aria-live="polite"><span>{sent?<CheckCircle2 size={20}/>:<MessageSquare size={20}/>}</span><div><b>{t(sent?'mAdminNotice':'mWaiting')}</b>{sent&&<p>{t('mBotReply')}</p>}</div></div>
      <button className={'scene-demo-button '+(sent?'is-sent':'')} onClick={()=>setSent(!sent)}>{sent?<RotateCcw size={16}/>:<Play size={16}/>}<span>{t(sent?'mAgain':'mTry')}</span><ArrowUpRight size={17}/></button>
     </div>
     <div className="scene-window-foot"><span className="scene-status-dot"/>{t('mDemoFlow')}<span>01 → 03</span></div>
    </div>
    <div className="scene-code-tag" aria-hidden="true"><Code2 size={18}/><div><b>YOUR BUSINESS</b><span>{t('flowNote')}</span></div><span className="scene-check"><Check size={15}/></span></div>
    <p className="scene-disclaimer">{t('mDemoNotice')}</p>
   </div>
  </section>
  <div className="market-facts"><div><strong>{String(products.length).padStart(2,'0')}</strong><p>{t('mReadyTools')}</p></div><div><strong>KK<span> / </span>RU<span> / </span>EN</strong><p>{t('mLanguages')}</p></div><div><strong>Kaspi Gold<ArrowDown size={17}/></strong><p>{t('mTransfer')}</p></div><div><strong>ZIP<Code2 size={20}/></strong><p>{t('mOwnCode')}</p></div></div>
 </>;
}

const shortcuts=[['telegram',Send,'mCategoryTelegram'],['sheets',Sheet,'mCategorySheets'],['website',PanelTop,'mCategoryWebsite'],['bundle',Layers,'mCategoryBundle']] as const;
export function CategoryShortcuts({lang,products,selected,onSelect}:{lang:Lang;products:Product[];selected:string;onSelect:(category:string)=>void}){
 const t=(key:string)=>translate(lang,key);
 return <nav className="market-shortcuts" aria-label={t('mCategoryCaption')}>{shortcuts.map(([category,Icon,key],index)=><button key={category} className={'market-shortcut '+category+(selected===category?' selected':'')} aria-pressed={selected===category} onClick={()=>onSelect(category)}><span className="shortcut-icon"><Icon size={23}/></span><div><small>0{index+1} / {String(products.filter(p=>p.category===category).length).padStart(2,'0')}</small><b>{t(key)}</b></div><ArrowUpRight size={18}/></button>)}</nav>;
}

export function MarketplaceFAQ({lang}:{lang:Lang}){
 const t=(key:string)=>translate(lang,key);
 return <section className="market-faq"><div><span className="eyebrow">{t('mCategoryCaption')}</span><h2>{t('mFAQTitle')}</h2><p>{t('mFAQHint')}</p><span className="faq-bot" aria-hidden="true"><Bot size={42}/></span></div><div className="faq-questions">{[1,2,3,4].map(number=><details key={number}><summary><span>{String(number).padStart(2,'0')}</span><b>{t('mQ'+number)}</b><ChevronDown size={19}/></summary><p>{t('mA'+number)}</p></details>)}</div></section>;
}
