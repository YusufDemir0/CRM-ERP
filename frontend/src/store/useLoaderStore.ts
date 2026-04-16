import { create } from 'zustand';

const DEFAULT_MESSAGE = 'İŞLEM YAPILIYOR. LÜTFEN KLAVYE MOUSE İLE TIKLAMA YAPMAYINIZ.';
const MIN_DURATION_MS = 800;

interface LoaderState {
  requestCount: number;
  message: string;
  isVisible: boolean;

  // Actions
  show: (message?: string) => void;
  hide: () => void;
}

let _startTime = 0;
let _hideTimer: ReturnType<typeof setTimeout> | null = null;

export const useLoaderStore = create<LoaderState>((set, get) => ({
  requestCount: 0,
  message: DEFAULT_MESSAGE,
  isVisible: false,

  show: (msg?: string) => {
    const { requestCount } = get();
    if (requestCount === 0) {
      _startTime = Date.now();
      if (_hideTimer) {
        clearTimeout(_hideTimer);
        _hideTimer = null;
      }
    }
    set({
      requestCount: requestCount + 1,
      isVisible: true,
      message: msg || DEFAULT_MESSAGE,
    });
  },

  hide: () => {
    const { requestCount } = get();
    const next = Math.max(0, requestCount - 1);

    if (next === 0) {
      const elapsed = Date.now() - _startTime;
      const remaining = MIN_DURATION_MS - elapsed;

      if (remaining > 0) {
        _hideTimer = setTimeout(() => {
          set({ isVisible: false });
          _hideTimer = null;
        }, remaining);
      } else {
        set({ isVisible: false });
      }
    }

    set({ requestCount: next });
  },
}));

export const selectIsLoading = (state: LoaderState) => state.isVisible;
export const selectMessage = (state: LoaderState) => state.message;
