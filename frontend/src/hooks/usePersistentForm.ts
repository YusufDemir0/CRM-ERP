import { useState, useEffect } from 'react';

/**
 * usePersistentForm Hook
 * Saves form state to sessionStorage automatically whenever it changes.
 * Useful for maintaining multi-step workflows across page navigations.
 * 
 * @param key - Unique key for this form storage
 * @param initialValues - Initial default values for the form
 * @returns [formData, setFormData, clearFormData]
 */
export function usePersistentForm<T>(key: string, initialValues: T) {
  // Initialize state from sessionStorage or fallback to initialValues
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

  // Sync state to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(formData));
  }, [key, formData]);

  /**
   * Clears the saved state from storage and resets form to initial values
   */
  const clearFormData = () => {
    sessionStorage.removeItem(key);
    setFormData(initialValues);
  };

  return [formData, setFormData, clearFormData] as const;
}
