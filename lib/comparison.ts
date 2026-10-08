import type { Product } from './catalog';

export const COMPARISON_LIMIT = 3;
export const COMPARISON_STORAGE_KEY = 'botstore-comparison-v1';

/** Accept only distinct product IDs; optionally reconcile against the live catalog. */
export function normalizeComparisonIds(value: unknown, available?: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return [];
  const result: string[] = [];
  for (const id of value) {
    if (typeof id !== 'string' || !id.trim() || id.length > 100 || result.includes(id)) continue;
    if (available && !available.has(id)) continue;
    result.push(id);
    if (result.length === COMPARISON_LIMIT) break;
  }
  return result;
}

export function readSavedComparison(raw: string | null): string[] {
  if (!raw || raw.length > 4096) return [];
  try { return normalizeComparisonIds(JSON.parse(raw)); }
  catch { return []; }
}

export function toggleComparisonId(current: readonly string[], id: string, available: ReadonlySet<string>): string[] {
  const ids = normalizeComparisonIds(current, available);
  if (ids.includes(id)) return ids.filter((item) => item !== id);
  if (!available.has(id) || ids.length >= COMPARISON_LIMIT) return ids;
  return normalizeComparisonIds([...ids, id], available);
}

export function comparisonProducts(ids: readonly string[], catalog: readonly Product[]): Product[] {
  const published = new Map(catalog.filter((product) => product.status === 'published').map((product) => [product.id, product]));
  return normalizeComparisonIds(ids, new Set(published.keys())).map((id) => published.get(id)!);
}

export function sameComparisonIds(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}
