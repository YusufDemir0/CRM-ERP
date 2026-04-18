import { create } from 'zustand';

/**
 * useLoaderStore
 * Manages global loading state.
 * [FIX-TASK-02]: Simplified state management. Counting is handled in api.ts interceptors.
 */
interface LoaderState {
  isLoading: boolean;
  message: string | null;
  
  // Actions
  show: (message?: string) => void;
  hide: () => void;
}

const DEFAULT_MESSAGE = 'İŞLEM YAPILIYOR...';

export const useLoaderStore = create<LoaderState>((set) => ({
  isLoading: false,
  message: null,

  show: (message = DEFAULT_MESSAGE) => {
    set({ isLoading: true, message });
  },

  hide: () => {
    set({ isLoading: false, message: null });
  }
}));

export const selectIsLoading = (state: LoaderState) => state.isLoading;
export const selectMessage = (state: LoaderState) => state.message;
