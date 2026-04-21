import { useQuery } from '@tanstack/react-query';

export interface TurkiyeLocation {
  id: number;
  name: string;
}

/**
 * useTurkiyeCities
 * Fetches and caches province data from turkiyeapi.dev
 * [FIX-TASK-08]: Migrated to React Query for global caching.
 */
export function useTurkiyeCities() {
  const { data: cities = [], isLoading: loading } = useQuery({
    queryKey: ['turkiye-provinces'],
    queryFn: async ({ signal }): Promise<TurkiyeLocation[]> => {
      const CACHE_KEY = 'turkiye-provinces-cache';
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);

      const res = await fetch('https://turkiyeapi.dev/api/v1/provinces', { signal });
      const data = await res.json();
      if (!data.data) return [];
      const result = data.data
        .map((c: TurkiyeLocation) => ({ id: c.id, name: c.name }))
        .sort((a: TurkiyeLocation, b: TurkiyeLocation) => a.name.localeCompare(b.name, 'tr'));
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(result));
      return result;
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
    gcTime: 1000 * 60 * 60 * 24 * 30, // 1 month
  });

  return { cities, loading };
}

/**
 * useTurkiyeDistricts
 * Fetches and caches district data for a specific province.
 */
export function useTurkiyeDistricts(provinceId: number | null) {
  const { data: districts = [], isLoading: loading } = useQuery({
    queryKey: ['turkiye-districts', provinceId],
    queryFn: async ({ signal }): Promise<TurkiyeLocation[]> => {
      if (!provinceId) return [];
      const res = await fetch(`https://turkiyeapi.dev/api/v1/provinces/${provinceId}`, { signal });
      const data = await res.json();
      if (!data.data || !data.data.districts) return [];
      return data.data.districts
        .map((d: TurkiyeLocation) => ({ id: d.id, name: d.name }))
        .sort((a: TurkiyeLocation, b: TurkiyeLocation) => a.name.localeCompare(b.name, 'tr'));
    },
    enabled: !!provinceId,
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return { districts, loading };
}
