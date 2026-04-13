import React, { createContext, useContext, useState, useCallback } from 'react';

export type QuickCreateType = 'department' | 'account' | 'party' | 'user' | 'item' | 'item-type' | 'code-group' | 'quantity-type' | 'bom';

interface QuickCreateStackItem {
  id: string;
  type: QuickCreateType;
  editingId: number | null;
  initialData?: any;
  onSuccess: (data: any) => void;
  onCancel: () => void;
}

interface QuickCreateContextType {
  stack: QuickCreateStackItem[];
  openCreate: (type: QuickCreateType, options: { editingId?: number | null, initialData?: any, onSuccess: (data: any) => void, onCancel?: () => void }) => void;
  closeCurrent: () => void;
}

const QuickCreateContext = createContext<QuickCreateContextType | undefined>(undefined);

export const QuickCreateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [stack, setStack] = useState<QuickCreateStackItem[]>([]);

  const openCreate = useCallback((type: QuickCreateType, options: { editingId?: number | null, initialData?: any, onSuccess: (data: any) => void, onCancel?: () => void }) => {
    const newItem: QuickCreateStackItem = {
      id: Math.random().toString(36).substring(7),
      type,
      editingId: options.editingId || null,
      initialData: options.initialData || {},
      onSuccess: options.onSuccess,
      onCancel: options.onCancel || (() => {}),
    };
    setStack(prev => [...prev, newItem]);
  }, []);

  const closeCurrent = useCallback(() => {
    setStack(prev => prev.slice(0, -1));
  }, []);

  return (
    <QuickCreateContext.Provider value={{ stack, openCreate, closeCurrent }}>
      {children}
    </QuickCreateContext.Provider>
  );
};

export const useQuickCreate = () => {
  const context = useContext(QuickCreateContext);
  if (!context) throw new Error('useQuickCreate must be used within a QuickCreateProvider');
  return context;
};
