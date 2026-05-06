import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  message: string;
  isDestructive: boolean;
  resolvePromise: ((value: boolean) => void) | null;
  showConfirm: (message: string, isDestructive?: boolean) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  message: '',
  isDestructive: false,
  resolvePromise: null,
  showConfirm: (message: string, isDestructive = false) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        message,
        isDestructive,
        resolvePromise: resolve,
      });
    });
  },
  handleConfirm: () => {
    const { resolvePromise } = get();
    if (resolvePromise) resolvePromise(true);
    set({ isOpen: false, resolvePromise: null });
  },
  handleCancel: () => {
    const { resolvePromise } = get();
    if (resolvePromise) resolvePromise(false);
    set({ isOpen: false, resolvePromise: null });
  },
}));
