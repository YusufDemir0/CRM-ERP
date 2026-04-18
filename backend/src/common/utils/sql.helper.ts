/**
 * SQL LIKE sorguları için özel karakterleri (%, _) escape eder.
 * DoS saldırılarını (Wildcard DoS) önlemek için kullanılır.
 */
export function escapeLike(input: string): string {
  if (!input) return '';
  // % -> \%
  // _ -> \_
  return input.replace(/[%_]/g, '\\$&');
}

/**
 * Arama sorgusu için güvenli LIKE parametresi üretir.
 * @param search Kullanıcıdan gelen arama metni
 * @param limit Maksimum karakter sınırı (default: 100)
 */
export function getSafeSearchPattern(search: string | undefined, limit = 100): string | null {
  if (!search) return null;
  const trimmed = search.trim().substring(0, limit);
  if (!trimmed) return null;
  return `%${escapeLike(trimmed)}%`;
}
