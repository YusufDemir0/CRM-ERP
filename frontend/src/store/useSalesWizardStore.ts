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
  city: string;
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
  selectedItems: SelectedItem[];
  step: number;
}

const initialDraft: DraftSaleData = {
  customer: null,
  staffId: '',
  phone: '',
  phone2: '',
  address: '',
  city: '',
  cityId: '',
  district: '',
  date: dayjs().format('YYYY-MM-DD'),
  deliveryDate: dayjs().format('YYYY-MM-DD'),
  paymentAccount: null,
  taxId: '',
  description: '',
  email: '',
  source: '',
  deposit: '0',
  discountAmount: '0',
  isTaxed: true,
  selectedItems: [],
  step: 1,
};

interface SalesWizardState {
  draftData: DraftSaleData;
  setDraftData: (data: DraftSaleData) => void;
  startQuickSale: (customer: Party | null) => void;
  reset: () => void;
}

export const useSalesWizardStore = create<SalesWizardState>()(
  persist(
    (set) => ({
      draftData: initialDraft,
      setDraftData: (data) => set({ draftData: data }),
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
          }
        });
      },
      reset: () => set({ draftData: initialDraft })
    }),
    {
      name: 'sales-wizard-storage',
    }
  )
);
