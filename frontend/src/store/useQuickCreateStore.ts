import { create } from 'zustand';

// ────── TYPES ──────

export type QuickCreateType = 
  | 'department' 
  | 'account' 
  | 'party' 
  | 'user' 
  | 'item' 
  | 'item-type' 
  | 'code-group' 
  | 'quantity-type' 
  | 'bom'
  | 'staff';

export interface QuickCreateResponse<T = unknown> {
  data: T & { id: number; name?: string; code?: string; title?: string };
}

export interface QuickCreateStackItem {
  id: string;
  type: QuickCreateType;
  editingId: number | null;
  initialData: Record<string, unknown>;
  onSuccess: (res: QuickCreateResponse) => void;
  onCancel: () => void;
}

export interface QuickCreateOptions {
  editingId?: number | null;
  initialData?: Record<string, unknown>;
  onSuccess?: (res: QuickCreateResponse) => void;
  onCancel?: () => void;
}

// ────── STORE INTERFACE ──────

interface QuickCreateState {
  stack: QuickCreateStackItem[];
  cache: Record<string, unknown>;

  // Actions
  openCreate: (type: QuickCreateType, options?: QuickCreateOptions) => void;
  closeCurrent: () => void;
  updateCache: (type: string, data: unknown) => void;
  getCache: (type: string) => unknown;
  clearCache: (type: string) => void;
}

// ────── ZUSTAND STORE ──────

export const useQuickCreateStore = create<QuickCreateState>((set, get) => ({
  stack: [],
  cache: {},

  openCreate: (type, options = {}) => {
    const newItem: QuickCreateStackItem = {
      id: Math.random().toString(36).substring(7),
      type,
      editingId: options.editingId ?? null,
      initialData: options.initialData ?? {},
      onSuccess: options.onSuccess ?? (() => {}),
      onCancel: options.onCancel ?? (() => {}),
    };
    set((state) => ({ stack: [...state.stack, newItem] }));
  },

  closeCurrent: () => {
    set((state) => ({ stack: state.stack.slice(0, -1) }));
  },

  updateCache: (type, data) => {
    set((state) => ({ cache: { ...state.cache, [type]: data } }));
  },

  getCache: (type) => {
    return get().cache[type] ?? null;
  },

  clearCache: (type) => {
    set((state) => {
      const newCache = { ...state.cache };
      delete newCache[type];
      return { cache: newCache };
    });
  },
}));
