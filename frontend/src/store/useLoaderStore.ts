import { create } from 'zustand';

/**
 * useLoaderStore
 * Manages global loading state.
 * [FIX-TASK-02]: Simplified state management. Counting is handled in api.ts interceptors.
 */
interface LoaderState {
  isLoading: boolean;
  message: string | null;
  count: number;
  startTime: number | null;
  
  // Actions
  show: (message?: string) => void;
  hide: () => void;
}

const DEFAULT_MESSAGE = 'İŞLEM YAPILIYOR...';
const MIN_DURATION = 2000;

export const useLoaderStore = create<LoaderState>((set, get) => ({
  isLoading: false,
  message: null,
  count: 0,
  startTime: null,

  show: (message = DEFAULT_MESSAGE) => {
    const { count, startTime } = get();
    set({ 
      count: count + 1,
      isLoading: true,
      message: message,
      startTime: startTime || Date.now()
    });
  },

  hide: () => {
    const { count, startTime } = get();
    const newCount = Math.max(0, count - 1);
    
    if (newCount === 0) {
      const elapsed = Date.now() - (startTime || 0);
      
      if (elapsed < MIN_DURATION) {
        setTimeout(() => {
          // Double check count in case a new request started during timeout
          if (get().count === 0) {
            set({ isLoading: false, message: null, startTime: null, count: 0 });
          }
        }, MIN_DURATION - elapsed);
      } else {
        set({ isLoading: false, message: null, startTime: null, count: 0 });
      }
      
      // Update count immediately even if we delay the hide
      set({ count: 0 });
    } else {
      set({ count: newCount });
    }
  }
}));

export const selectIsLoading = (state: LoaderState) => state.isLoading;
export const selectMessage = (state: LoaderState) => state.message;
