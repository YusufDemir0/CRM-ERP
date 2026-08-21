import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Party, Account, Sale } from '../types';
import { SelectedItem } from '../pages/modules/SalesWizard/types';
import { Decimal } from 'decimal.js';
import dayjs from 'dayjs';

export interface DraftSaleData {
  id?: string | number;
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
  isInvoiced: boolean | null; // NEW: Faturalı/Faturasız
  representativePrice: string; // NEW: Temsilci tarafından girilen fiyat
  selectedItems: SelectedItem[];
  step: number; // 1-7 for logistics steps
  phase: 'customer' | 'logistics' | 'products' | 'preview' | 'offer' | 'summary';
  maturityDays: number;
  paymentType: 'NAKİT' | 'VADELİ';
  installments: number;
}

const initialDraft: DraftSaleData = {
  id: undefined,
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
  deposit: '',
  discountAmount: '0',
  isTaxed: true,
  isInvoiced: null,
  representativePrice: '',
  selectedItems: [],
  step: 1,
  phase: 'customer',
  maturityDays: 0,
  paymentType: 'NAKİT',
  installments: 1,
};

interface SalesWizardState {
  draftData: DraftSaleData;
  setDraftData: (data: Partial<DraftSaleData>) => void;
  setPhase: (phase: DraftSaleData['phase']) => void;
  setStep: (step: number) => void;
  startQuickSale: (customer: Party | null) => void;
  loadDraftSale: (sale: Sale) => void;
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
      setStep: (step) => set((state) => {
        let phase: 'customer' | 'logistics' | 'products' | 'preview' = 'customer';
        if (step >= 3 && step <= 7) phase = 'logistics';
        else if (step >= 8 && step <= 10) phase = 'products';
        else if (step >= 11) phase = 'preview';
        return {
          draftData: { ...state.draftData, step, phase }
        };
      }),
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
      loadDraftSale: (sale) => {
        const selectedItems: SelectedItem[] = (sale.items || []).map(si => {
          return {
            ...(si.item || {}),
            id: String(si.itemId || si.item?.id),
            quantity: Number(si.quantity || 0),
            unitPrice: Number(si.price || 0),
            taxRate: Number(si.kdvRate || si.item?.kdv || 20),
          } as SelectedItem;
        });

        const repPrice = new Decimal(sale.grandTotal || 0);

        set({
          draftData: {
            ...initialDraft,
            id: sale.id,
            customer: sale.party || null,
            staffId: sale.staffId ? String(sale.staffId) : '',
            phone: sale.phone || sale.party?.phone1 || '',
            phone2: sale.party?.phone2 || '',
            address: sale.address || sale.party?.address || '',
            cityId: sale.city || (sale.party?.cityId ? String(sale.party.cityId) : ''),
            district: sale.district || sale.party?.districtName || '',
            date: sale.createdAt ? dayjs(sale.createdAt).format('YYYY-MM-DD') : '',
            deliveryDate: sale.deliveryDate ? dayjs(sale.deliveryDate).format('YYYY-MM-DD') : '',
            paymentAccount: sale.commercialAccount || null,
            taxId: sale.taxNumber || sale.party?.taxNumber || '',
            description: sale.notes || '',
            email: sale.email || sale.party?.email || '',
            source: sale.source || '',
            deposit: String(sale.deposit || 0),
            discountAmount: String(sale.discountAmount || 0),
            isTaxed: true,
            isInvoiced: sale.saleType?.abbreviation === 'TPT',
            representativePrice: repPrice.gt(0) ? repPrice.toFixed(2) : '',
            selectedItems,
            phase: 'customer',
            step: 1,
            maturityDays: Number(sale.maturityDays || 0),
            paymentType: sale.paymentType === 'VADELİ' ? 'VADELİ' : 'NAKİT',
            installments: Number(sale.installments || 1),
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
