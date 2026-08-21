import { create } from 'zustand';

interface ConfirmState {
  isOpen: boolean;
  message: string;
  isDestructive: boolean;
  confirmText?: string;
  resolvePromise: ((value: boolean) => void) | null;
  showConfirm: (message: string, isDestructive?: boolean, confirmText?: string) => Promise<boolean>;
  handleConfirm: () => void;
  handleCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  message: '',
  isDestructive: false,
  confirmText: undefined,
  resolvePromise: null,
  showConfirm: (message: string, isDestructive = false, confirmText?: string) => {
    return new Promise((resolve) => {
      set({
        isOpen: true,
        message,
        isDestructive,
        confirmText,
        resolvePromise: resolve,
      });
    });
  },
  handleConfirm: () => {
    const { resolvePromise } = get();
    if (resolvePromise) resolvePromise(true);
    set({ isOpen: false, resolvePromise: null, confirmText: undefined });
  },
  handleCancel: () => {
    const { resolvePromise } = get();
    if (resolvePromise) resolvePromise(false);
    set({ isOpen: false, resolvePromise: null, confirmText: undefined });
  },
}));
