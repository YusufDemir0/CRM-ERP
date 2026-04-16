import { useState, useEffect } from 'react';

export function useTurkiyeCities() {
  const [cities, setCities] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('https://turkiyeapi.dev/api/v1/provinces')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          const sorted = data.data.map((c: any) => ({
            id: c.id,
            name: c.name
          })).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'));
          setCities(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { cities, loading };
}

export function useTurkiyeDistricts(provinceId: number | null) {
  const [districts, setDistricts] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!provinceId) {
      setDistricts([]);
      return;
    }
    setLoading(true);
    fetch(`https://turkiyeapi.dev/api/v1/provinces/${provinceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.data && data.data.districts) {
          const sorted = data.data.districts.map((d: any) => ({
            id: d.id,
            name: d.name
          })).sort((a: any, b: any) => a.name.localeCompare(b.name, 'tr'));
          setDistricts(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [provinceId]);

  return { districts, loading };
}
