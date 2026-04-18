import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * useSettingsStore
 * Replaces SettingsContext for better performance and centralized state.
 * [FIX-TASK-06]: Migrated to Zustand + Persist with debounced storage.
 */

interface AppSettings {
  defaultCurrency: string;
  authorizedPhone: string;
}

interface SettingsState {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultCurrency: 'TRY',
  authorizedPhone: '+90 555 555 55 55',
};

const SETTINGS_KEY = 'erp_app_settings';


export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: SETTINGS_KEY,
      storage: createJSONStorage(() => ({
        getItem: (name) => localStorage.getItem(name),
        setItem: (() => {
          let timeoutId: ReturnType<typeof setTimeout>;
          return (name: string, value: string) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
              try {
                localStorage.setItem(name, value);
              } catch (e) {
                console.error('Settings persistence failed', e);
              }
            }, 1000);
          };
        })(),
        removeItem: (name) => localStorage.removeItem(name),
      })),
    }
  )
);
