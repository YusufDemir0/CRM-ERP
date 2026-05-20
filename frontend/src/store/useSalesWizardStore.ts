import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Party, Account } from '../types';
import { SelectedItem } from '../pages/modules/SalesWizard/types';
import dayjs from 'dayjs';

export interface DraftSaleData {
  customer: Party | null;
  staffId: string;
  phone: string;
  phone2: string;
  address: string;
  cityId: string;
  district: string;
  date: string;
  deliveryDate: string;
  paymentAccount: Account | null;
  taxId: string;
  description: string;
  email: string;
  source: string;
  deposit: string;
  discountAmount: string;
  isTaxed: boolean;
  isInvoiced: boolean; // NEW: Faturalı/Faturasız
  representativePrice: string; // NEW: Temsilci tarafından girilen fiyat
  selectedItems: SelectedItem[];
  step: number; // 1-7 for logistics steps
  phase: 'customer' | 'logistics' | 'products' | 'offer' | 'summary';
}

const initialDraft: DraftSaleData = {
  customer: null,
  staffId: '',
  phone: '',
  phone2: '',
  address: '',
  cityId: '',
  district: '',
  date: '',
  deliveryDate: '',
  paymentAccount: null,
  taxId: '',
  description: '',
  email: '',
  source: '',
  deposit: '0',
  discountAmount: '0',
  isTaxed: true,
  isInvoiced: true,
  representativePrice: '0',
  selectedItems: [],
  step: 1,
  phase: 'customer',
};

interface SalesWizardState {
  draftData: DraftSaleData;
  setDraftData: (data: Partial<DraftSaleData>) => void;
  setPhase: (phase: DraftSaleData['phase']) => void;
  setStep: (step: number) => void;
  startQuickSale: (customer: Party | null) => void;
  reset: () => void;
}

export const useSalesWizardStore = create<SalesWizardState>()(
  persist(
    (set) => ({
      draftData: initialDraft,
      setDraftData: (data) => set((state) => ({ 
        draftData: { ...state.draftData, ...data } 
      })),
      setPhase: (phase) => set((state) => ({
        draftData: { ...state.draftData, phase }
      })),
      setStep: (step) => set((state) => ({
        draftData: { ...state.draftData, step }
      })),
      startQuickSale: (customer) => {
        set({
          draftData: {
            ...initialDraft,
            customer,
            phone: customer?.phone1 || '',
            phone2: customer?.phone2 || '',
            email: customer?.email || '',
            address: customer?.address || '',
            taxId: customer?.taxNumber || '',
            cityId: String(customer?.cityId || ''),
            district: customer?.districtName || '',
            phase: 'customer',
            step: 1
          }
        });
      },
      reset: () => set({ draftData: initialDraft })
    }),
    {
      name: 'sales-wizard-storage',
      partialize: (state) => ({ 
        draftData: {
          ...state.draftData,
          // We can potentially exclude large lookup-like data if it was there, 
          // but for now let's just keep the essentials.
        }
      }),
    }
  )
);
