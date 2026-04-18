import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * usePersistentForm Hook
 * Saves form state to sessionStorage automatically whenever it changes.
 * FE-10: Optimized to prevent main thread blocking and re-render loops.
 * [TASK-008]: Added beforeunload listener to prevent data loss on tab closure.
 */
const SENSITIVE_FIELDS = ['password', 'passwordConfirm', 'currentPassword', 'newPassword', 'creditCard', 'cvv', 'pin'];

export function usePersistentForm<T extends Record<string, unknown>>(
  baseKey: string,
  initialValues: T,
  excludeFields: (keyof T)[] = []
) {
  const key = `persistent_form_${baseKey}`;
  
  // FE-10: Memoize excluded fields to prevent dependency-driven effect resets
  const memoizedExclude = useMemo(() => 
    ([...SENSITIVE_FIELDS, ...excludeFields] as string[]), 
    [excludeFields]
  );

  const [formData, setInternalFormData] = useState<T>(() => {
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

  // Use a ref for the latest data to avoid effect re-runs on every keystroke
  const dataRef = useRef(formData);
  useEffect(() => {
    dataRef.current = formData;
  }, [formData]);

  const saveToStorage = useCallback(() => {
    try {
      const safeData = { ...dataRef.current };
      memoizedExclude.forEach((field) => {
        delete (safeData as Record<string, unknown>)[field];
      });
      
      const serialized = JSON.stringify(safeData);
      if (sessionStorage.getItem(key) !== serialized) {
        sessionStorage.setItem(key, serialized);
      }
    } catch (e) {
      console.error('Persistence failed', e);
    }
  }, [key, memoizedExclude]);

  useEffect(() => {
    // [TASK-008]: Sync save on window close/reload
    const handleBeforeUnload = () => {
      saveToStorage();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      saveToStorage(); // Also save on component unmount
    };
  }, [saveToStorage]);

  // FE-10: Stabilize setter reference
  const setFormData = useCallback((val: T | ((prev: T) => T)) => {
    setInternalFormData(val);
  }, []);

  const clearFormData = useCallback(() => {
    sessionStorage.removeItem(key);
    setInternalFormData(initialValues);
  }, [key, initialValues]);

  return [formData, setFormData, clearFormData] as const;
}