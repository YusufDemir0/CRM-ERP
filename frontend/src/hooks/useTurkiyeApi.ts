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
      const res = await fetch('https://turkiyeapi.dev/api/v1/provinces', { signal });
      const data = await res.json();
      if (!data.data) return [];
      return data.data
        .map((c: TurkiyeLocation) => ({ id: c.id, name: c.name }))
        .sort((a: TurkiyeLocation, b: TurkiyeLocation) => a.name.localeCompare(b.name, 'tr'));
    },
    staleTime: Infinity,
    gcTime: Infinity,
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
