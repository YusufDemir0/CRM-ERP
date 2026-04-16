import { useState, useEffect } from 'react';

/**
 * usePersistentForm Hook
 * Saves form state to sessionStorage automatically whenever it changes.
 * Scoped by URL pathname to prevent multi-tab interference.
 */
export function usePersistentForm<T>(baseKey: string, initialValues: T) {
  const key = `persistent_form_${baseKey}`;

  const [formData, setFormData] = useState<T>(() => {
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing session storage for form state', e);
      }
    }
    return initialValues;
  });

  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(formData));
  }, [key, formData]);

  const clearFormData = () => {
    sessionStorage.removeItem(key);
    setFormData(initialValues);
  };

  return [formData, setFormData, clearFormData] as const;
}