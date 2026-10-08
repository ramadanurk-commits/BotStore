'use client';

import { ArrowLeftRight, ArrowUpRight, Check, Package, X } from 'lucide-react';
import type { Lang, Product } from '@/lib/catalog';
import { translate } from '@/lib/i18n';
import { COMPARISON_LIMIT } from '@/lib/comparison';

const money = (value: number, lang: Lang) => value === 0
  ? translate(lang, 'free')
  : new Intl.NumberFormat(lang === 'kk' ? 'kk-KZ' : lang === 'ru' ? 'ru-RU' : 'en-US').format(value) + ' ₸';

export function CompareButton({ product, lang, selected, disabled, limitReached, onToggle }: {
  product: Product; lang: Lang; selected: boolean; disabled: boolean;
  limitReached: boolean; onToggle: (id: string) => void;
}) {
  const label = translate(lang, selected ? 'compareRemove' : 'compareAdd');
  return <button
    className={'comparison-toggle' + (selected ? ' selected' : '')}
    type="button" aria-pressed={selected}
    aria-label={label + ': ' + product.content[lang].name}
    title={limitReached && !selected ? translate(lang, 'compareLimit') : label}
    disabled={disabled || (limitReached && !selected)} onClick={() => onToggle(product.id)}
  >{selected ? <Check size={16} /> : <ArrowLeftRight size={16} />}
    {translate(lang, selected ? 'compareSelected' : 'compareAdd')}
  </button>;
}

export function ComparisonTray({ products, lang, onRemove, onClear, onCompare }: {
  products: Product[]; lang: Lang; onRemove: (id: string) => void;
  onClear: () => void; onCompare: () => void;
}) {
  if (!products.length) return null;
  const t = (key: string) => translate(lang, key);
  return <aside className="comparison-tray" aria-label={t('compare')}>
    <div className="comparison-tray-summary"><ArrowLeftRight size={20} />
      <div><b>{t('compare')} <span aria-live="polite">{products.length}/{COMPARISON_LIMIT}</span></b>
        <small>{t(products.length < 2 ? 'compareChooseMore' : 'compareIntro')}</small></div>
    </div>
    <ul className="comparison-chips">{products.map((p) => <li key={p.id}>
      <span>{p.content[lang].name}</span><button type="button" onClick={() => onRemove(p.id)}
        aria-label={t('compareRemove') + ': ' + p.content[lang].name}><X size={15} /></button>
    </li>)}</ul>
    <div className="comparison-tray-actions"><button className="text-button" type="button" onClick={onClear}>{t('compareClear')}</button>
      <button className="button" type="button" disabled={products.length < 2} onClick={onCompare}>
        {t('compare')}<ArrowUpRight size={16} /></button></div>
  </aside>;
}

export function ComparisonPage({ products, lang, storageUnavailable, onRemove, onClear, onOpen, onBrowse }: {
  products: Product[]; lang: Lang; storageUnavailable: boolean;
  onRemove: (id: string) => void; onClear: () => void;
  onOpen: (product: Product) => void; onBrowse: () => void;
}) {
  const t = (key: string) => translate(lang, key);
  return <section className="comparison-page">
    <div className="page-heading"><div><div className="eyebrow">BOTSTORE / {t('compare')}</div>
      <h1>{t('compareTitle')}</h1><p>{t('compareIntro')}</p></div></div>
    {storageUnavailable && <p className="comparison-notice" role="status">{t('compareStorage')}</p>}
    {!products.length ? <div className="page-empty panel"><Package /><h2>{t('compareEmpty')}</h2>
      <p>{t('compareEmptyHint')}</p><button className="button" type="button" onClick={onBrowse}>{t('compareBrowse')}<ArrowUpRight size={17} /></button>
    </div> : <>
      <div className="comparison-toolbar"><p aria-live="polite">{products.length}/{COMPARISON_LIMIT} · {t(products.length < 2 ? 'compareChooseMore' : 'compareScroll')}</p>
        <div className="row-actions"><button className="button outline" type="button" onClick={onBrowse}>{t('compareBrowse')}</button>
          <button className="text-button" type="button" onClick={onClear}>{t('compareClear')}</button></div></div>
      <div className="comparison-table-scroll" tabIndex={0} role="region" aria-label={t('compareIntro')}>
        <table className="comparison-table" style={{ minWidth: 170 + products.length * 245 }}>
          <caption className="sr-only">{t('compareIntro')}</caption>
          <thead><tr><th scope="col">{t('compareParameter')}</th>{products.map((p) => <th scope="col" key={p.id}>
            <div className="comparison-product-heading"><span>{t(p.category)}</span><button type="button" onClick={() => onRemove(p.id)}
              aria-label={t('compareRemove') + ': ' + p.content[lang].name}><X size={18} /></button></div>
            <h2>{p.content[lang].name}</h2><button className="small-button" type="button" onClick={() => onOpen(p)}>{t('compareOpen')}<ArrowUpRight size={15} /></button>
          </th>)}</tr></thead>
          <tbody>
            <tr><th scope="row">{t('comparePrice')}</th>{products.map((p) => <td key={p.id}><strong className="comparison-price">{money(p.price, lang)}</strong></td>)}</tr>
            <tr><th scope="row">{t('compareCategory')}</th>{products.map((p) => <td key={p.id}>{t(p.category)}</td>)}</tr>
            <tr><th scope="row">{t('compareDescription')}</th>{products.map((p) => <td key={p.id}>{p.content[lang].description || '—'}</td>)}</tr>
            <tr><th scope="row">{t('compareFeatures')}</th>{products.map((p) => <td key={p.id}><ul className="comparison-feature-list">
              {p.content[lang].features.split('\n').map((f) => f.trim()).filter(Boolean).map((f, i) => <li key={i}><Check size={15} /><span>{f}</span></li>)}
            </ul></td>)}</tr>
            <tr><th scope="row">{t('compareRequirements')}</th>{products.map((p) => <td className="comparison-requirements" key={p.id}>{p.content[lang].requirements || '—'}</td>)}</tr>
            <tr><th scope="row">{t('compareFormat')}</th>{products.map((p) => <td key={p.id}>{p.filename || '—'}</td>)}</tr>
          </tbody>
        </table>
      </div><p className="comparison-footnote">{t('compareHint')}</p>
    </>}
  </section>;
}
