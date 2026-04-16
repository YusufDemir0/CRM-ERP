import { useState, useMemo, useCallback } from 'react';

export interface SortConfig {
  key: string;
  direction: 'asc' | 'desc';
}

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

    const getNestedValue = (obj: T, key: string): unknown => {
      return key.split('.').reduce<unknown>((acc, part) => {
        if (acc && typeof acc === 'object') return (acc as Record<string, unknown>)[part];
        return undefined;
      }, obj);
    };

    return [...data].sort((a, b) => {
      for (const { key, direction } of sortConfigs) {
        let valA = getNestedValue(a, key);
        let valB = getNestedValue(b, key);

        if (typeof valA === 'string') valA = valA.toLocaleLowerCase('tr-TR');
        if (typeof valB === 'string') valB = valB.toLocaleLowerCase('tr-TR');

        if (valA == null && valB != null) return 1;
        if (valA != null && valB == null) return -1;

        if (valA! < valB!) return direction === 'asc' ? -1 : 1;
        if (valA! > valB!) return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfigs, onSortChange]);

  return { sortedData, sortConfigs, toggleSort, setSortConfigs };
}
