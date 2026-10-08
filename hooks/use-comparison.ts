'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Product } from '@/lib/catalog';
import {
  COMPARISON_LIMIT, COMPARISON_STORAGE_KEY, comparisonProducts,
  normalizeComparisonIds, readSavedComparison, sameComparisonIds, toggleComparisonId,
} from '@/lib/comparison';

/** Browser-only preferences: no accounts, orders or payment state are changed. */
export function useComparison(catalog: readonly Product[], catalogReady: boolean) {
  const [ids, setIds] = useState<string[]>([]);
  const [restored, setRestored] = useState(false);
  const [storageUnavailable, setStorageUnavailable] = useState(false);
  const available = useMemo(() => new Set(catalog.filter((p) => p.status === 'published').map((p) => p.id)), [catalog]);

  useEffect(() => {
    try { setIds(readSavedComparison(localStorage.getItem(COMPARISON_STORAGE_KEY))); }
    catch { setStorageUnavailable(true); }
    setRestored(true);
  }, []);

  useEffect(() => {
    // Wait for a successful bootstrap. An empty loading/error state is not an empty catalog.
    if (!catalogReady || !restored) return;
    setIds((current) => {
      const next = normalizeComparisonIds(current, available);
      return sameComparisonIds(current, next) ? current : next;
    });
  }, [available, catalogReady, restored]);

  useEffect(() => {
    if (!catalogReady || !restored) return;
    try {
      localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(normalizeComparisonIds(ids, available)));
    } catch { setStorageUnavailable(true); }
  }, [ids, available, catalogReady, restored]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== COMPARISON_STORAGE_KEY && event.key !== null) return;
      const next = readSavedComparison(event.newValue);
      setIds(catalogReady ? normalizeComparisonIds(next, available) : next);
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [available, catalogReady]);

  const toggle = useCallback((id: string) => {
    if (!catalogReady || !restored) return;
    setIds((current) => toggleComparisonId(current, id, available));
  }, [available, catalogReady, restored]);
  const remove = useCallback((id: string) => setIds((current) => current.filter((item) => item !== id)), []);
  const clear = useCallback(() => setIds([]), []);
  const products = useMemo(() => comparisonProducts(ids, catalog), [ids, catalog]);

  return {
    products, ids: products.map((p) => p.id), toggle, remove, clear,
    ready: restored && catalogReady, storageUnavailable,
    limitReached: products.length >= COMPARISON_LIMIT,
  };
}
