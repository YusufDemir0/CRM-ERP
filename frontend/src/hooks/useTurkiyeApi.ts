import { useQuery } from '@tanstack/react-query';
import { TURKIYE_CITIES } from '../constants/locations';

export interface TurkiyeLocation {
  id: number;
  name: string;
}

/**
 * useTurkiyeCities
 * Uses static local data for performance.
 */
export function useTurkiyeCities() {
  return { cities: TURKIYE_CITIES, loading: false };
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
