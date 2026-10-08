import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const require = createRequire(import.meta.url);
const { build } = createRequire(require.resolve('vite'))('esbuild');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
await mkdir('.sites-runtime', { recursive: true });
await build({
  stdin: {
    contents: "export * from './lib/comparison'; export * from './app/comparison'; export {catalog} from './lib/catalog'; export {translate} from './lib/i18n'; export {comparison} from './lib/comparison-i18n';",
    resolveDir: process.cwd(), sourcefile: 'comparison-test-entry.ts',
  },
  bundle: true, platform: 'node', format: 'cjs', target: 'es2022', jsx: 'automatic',
  external: ['react', 'react/jsx-runtime', 'lucide-react'],
  outfile: '.sites-runtime/comparison-test.cjs',
});
const c = require('../.sites-runtime/comparison-test.cjs');
let count = 0;
const check = (condition, name) => { assert.ok(condition, name); count++; };
const equal = (value, expected, name) => { assert.deepEqual(value, expected, name); count++; };
const available = new Set(['a', 'b', 'c', 'd']);
equal(c.normalizeComparisonIds(null), [], 'non-array saved value ignored');
equal(c.normalizeComparisonIds(['a', 'a', 1, '', ' ', 'b', 'c', 'd']), ['a', 'b', 'c'], 'IDs deduplicated and limited to three');
equal(c.normalizeComparisonIds(['missing', 'b', 'a'], available), ['b', 'a'], 'unavailable products dropped, order retained');
equal(c.readSavedComparison('{broken'), [], 'malformed JSON recovers');
equal(c.readSavedComparison('{"ids":["a"]}'), [], 'unexpected stored shape rejected');
equal(c.readSavedComparison(' '.repeat(4097)), [], 'oversized stored data ignored');
equal(c.readSavedComparison('["a","b"]'), ['a', 'b'], 'browser preference restored');
equal(c.toggleComparisonId(['a', 'b', 'c'], 'd', available), ['a', 'b', 'c'], 'fourth product is not added');
equal(c.toggleComparisonId(['a', 'b', 'c'], 'b', available), ['a', 'c'], 'selected item can be removed at the limit');
equal(c.toggleComparisonId(['a'], 'missing', available), ['a'], 'unknown product cannot be selected');
equal(c.toggleComparisonId(['a', 'missing'], 'b', available), ['a', 'b'], 'stale selection reconciles before adding');
const original = ['a']; c.toggleComparisonId(original, 'b', available);
equal(original, ['a'], 'selection updates do not mutate previous state');
check(c.sameComparisonIds(['a', 'b'], ['a', 'b']), 'same state is recognized');
check(!c.sameComparisonIds(['a', 'b'], ['b', 'a']), 'order changes are recognized');
const published = c.catalog.slice(0, 3).map((p) => ({ ...p, owner_id: 'test-owner', status: 'published', updated_at: 0 }));
const stale = { ...published[0], id: 'archived', status: 'archived' };
equal(c.comparisonProducts(['archived', published[1].id, 'missing'], [...published, stale]).map((p) => p.id), [published[1].id], 'only current published catalog rows are shown');
const updated = { ...published[0], price: 12345 };
check(c.comparisonProducts([updated.id], [updated])[0].price === 12345, 'comparison uses current price instead of saved product data');
for (const lang of ['kk', 'ru', 'en']) {
  check(Object.keys(c.comparison).every((key) => c.translate(lang, key) !== key), lang + ': all comparison labels translated');
  const html = renderToStaticMarkup(React.createElement(c.ComparisonPage, {
    products: published.slice(0, 2), lang, storageUnavailable: false,
    onRemove() {}, onClear() {}, onOpen() {}, onBrowse() {},
  }));
  check(html.includes(published[0].content[lang].name) && html.includes(published[1].content[lang].name), lang + ': both product headings rendered');
  check(html.includes(published[0].content[lang].requirements), lang + ': actual setup requirements rendered');
  check(html.includes('scope="row"') && html.includes('tabindex="0"'), lang + ': row headers and keyboard-accessible table scroll');
  const empty = renderToStaticMarkup(React.createElement(c.ComparisonPage, {
    products: [], lang, storageUnavailable: true,
    onRemove() {}, onClear() {}, onOpen() {}, onBrowse() {},
  }));
  check(empty.includes(c.translate(lang, 'compareEmpty')) && empty.includes(c.translate(lang, 'compareStorage')), lang + ': empty state and unavailable storage explained');
}
const disabled = renderToStaticMarkup(React.createElement(c.CompareButton, {
  product: published[0], lang: 'ru', selected: false, disabled: false,
  limitReached: true, onToggle() {},
}));
check(disabled.includes('disabled=""'), 'unselected fourth product button disabled');
const selected = renderToStaticMarkup(React.createElement(c.CompareButton, {
  product: published[0], lang: 'ru', selected: true, disabled: false,
  limitReached: true, onToggle() {},
}));
check(selected.includes('aria-pressed="true"') && !selected.includes('disabled=""'), 'selected product button remains removable');
const tray = renderToStaticMarkup(React.createElement(c.ComparisonTray, {
  products: [published[0]], lang: 'ru', onRemove() {}, onClear() {}, onCompare() {},
}));
check(tray.includes('disabled=""') && tray.includes(c.translate('ru', 'compareChooseMore')), 'one-item selection asks for a second product');
equal(renderToStaticMarkup(React.createElement(c.ComparisonTray, {
  products: [], lang: 'ru', onRemove() {}, onClear() {}, onCompare() {},
})), '', 'empty tray does not obscure the catalog');
console.log('PASS: ' + count + ' comparison checks (selection, current catalog, translations, accessible server rendering).');
