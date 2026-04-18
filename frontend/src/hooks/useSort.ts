import { useState, useMemo, useCallback } from 'react';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

const collator = new Intl.Collator('tr-TR', { numeric: true });

export function useSort<T>(data: T[], initialSort: SortConfig[] = [], onSortChange?: (configs: SortConfig[]) => void) {
  const [sortConfigs, setSortConfigs] = useState<SortConfig[]>(initialSort);

  const toggleSort = useCallback((key: string, multiSort: boolean = false) => {
    setSortConfigs(prev => {
      const existing = prev.find(s => s.key === key);
      let next: SortConfig[];

      if (existing) {
        if (existing.direction === 'asc') {
          next = prev.map(s => s.key === key ? { ...s, direction: 'desc' } : s);
        } else {
          next = prev.filter(s => s.key !== key);
        }
      } else {
        const newSort: SortConfig = { key, direction: 'asc' };
        next = multiSort ? [...prev, newSort] : [newSort];
      }

      if (onSortChange) {
        onSortChange(next);
      }
      return next;
    });
  }, [onSortChange]);

  const sortedData = useMemo(() => {
    if (onSortChange) return data; // Server handles sorting
    if (sortConfigs.length === 0) return data;

    const parsedConfigs = sortConfigs.map(c => ({
      direction: c.direction,
      path: c.key.split('.')
    }));

    // Schwartzian transform for O(n) key extraction instead of O(n log n)
    const mapped = data.map((item, index) => {
      const values = parsedConfigs.map(config => {
        let val: unknown = item;
        for (const p of config.path) {
          if (val == null) break;
          val = (val as Record<string, unknown>)[p];
        }
        return val;
      });
      return { index, item, values };
    });

    mapped.sort((a, b) => {
      for (let i = 0; i < parsedConfigs.length; i++) {
        const valA = a.values[i];
        const valB = b.values[i];
        
        if (valA === valB) continue;
        if (valA == null) return 1;
        if (valB == null) return -1;

        const isAsc = parsedConfigs[i].direction === 'asc';
        if (typeof valA === 'string' && typeof valB === 'string') {
          const cmp = collator.compare(valA, valB);
          if (cmp !== 0) return isAsc ? cmp : -cmp;
        } else {
          if (valA < valB) return isAsc ? -1 : 1;
          if (valA > valB) return isAsc ? 1 : -1;
        }
      }
      return a.index - b.index; // Maintain stability
    });

    return mapped.map(el => el.item);
  }, [data, sortConfigs, onSortChange]);

  return { sortedData, sortConfigs, toggleSort, setSortConfigs };
}
