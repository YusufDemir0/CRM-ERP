import { create } from 'zustand';
import { Party, Item, SaleType, Account } from '../types';
import { SelectedItem } from '../pages/modules/SalesWizard/types';
import dayjs from 'dayjs';

interface SalesWizardState {
  step: number;
  isProductPhase: boolean;
  customer: Party | null;
  staffId: number | null;
  phone: string;
  phone2: string;
  address: string;
  city: string;
  cityId: number;
  district: string;
  date: string;
  deliveryDate: string;
  paymentAccount: Account | null;
  taxId: string;
  description: string;
  email: string;
  source: string;
  deposit: number;
  discountAmount: number;
  isTaxed: boolean;
  isNewInfo: boolean;
  selectedItems: SelectedItem[];
  loading: boolean;
  
  // Actions
  setStep: (step: number) => void;
  setIsProductPhase: (val: boolean) => void;
  setCustomer: (customer: Party | null) => void;
  setStaffId: (staffId: number | null) => void;
  setPhone: (phone: string) => void;
  setPhone2: (phone: string) => void;
  setAddress: (address: string) => void;
  setCity: (city: string) => void;
  setCityId: (cityId: number) => void;
  setDistrict: (district: string) => void;
  setIsNewInfo: (val: boolean) => void;
  setDate: (date: string) => void;
  setDeliveryDate: (date: string) => void;
  setPaymentAccount: (account: Account | null) => void;
  setTaxId: (taxId: string) => void;
  setDescription: (desc: string) => void;
  setEmail: (email: string) => void;
  setSource: (source: string) => void;
  setDeposit: (val: number) => void;
  setDiscountAmount: (val: number) => void;
  setIsTaxed: (val: boolean) => void;
  setSelectedItems: (items: SelectedItem[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useSalesWizardStore = create<SalesWizardState>((set) => ({
  step: 1,
  isProductPhase: false,
  customer: null,
  staffId: null,
  phone: '',
  phone2: '',
  address: '',
  city: '',
  cityId: 0,
  district: '',
  isNewInfo: false,
  date: dayjs().format('YYYY-MM-DD'),
  deliveryDate: dayjs().format('YYYY-MM-DD'),
  paymentAccount: null,
  taxId: '',
  description: '',
  email: '',
  source: '',
  deposit: 0,
  discountAmount: 0,
  isTaxed: true,
  selectedItems: [],
  loading: false,

  setStep: (step) => set({ step }),
  setIsProductPhase: (isProductPhase) => set({ isProductPhase }),
  setCustomer: (customer) => set({ 
    customer, 
    phone: customer?.phone1 || '', 
    phone2: customer?.phone2 || '',
    email: customer?.email || '', 
    address: customer?.address || '', 
    taxId: customer?.taxNumber || '',
    cityId: customer?.cityId || 0,
    district: customer?.districtName || '',
    isNewInfo: false
  }),
  setStaffId: (staffId) => set({ staffId }),
  setPhone: (phone) => set({ phone }),
  setPhone2: (phone2) => set({ phone2 }),
  setAddress: (address) => set({ address }),
  setCity: (city) => set({ city }),
  setCityId: (cityId) => set({ cityId }),
  setDistrict: (district) => set({ district }),
  setIsNewInfo: (isNewInfo) => {
    if (isNewInfo) {
      set({ 
        phone: '', 
        phone2: '', 
        email: '', 
        taxId: '', 
        address: '', 
        city: '', 
        district: '',
        isNewInfo: true 
      });
    } else {
      const { customer } = useSalesWizardStore.getState();
      if (customer) {
        set({
          phone: customer.phone1 || '',
          phone2: customer.phone2 || '',
          email: customer.email || '',
          taxId: customer.taxNumber || '',
          address: customer.address || '',
          district: customer.districtName || '',
          isNewInfo: false
        });
      } else {
        set({ isNewInfo: false });
      }
    }
  },
  setDate: (date) => set({ date }),
  setDeliveryDate: (deliveryDate) => set({ deliveryDate }),
  setPaymentAccount: (paymentAccount) => set({ paymentAccount }),
  setTaxId: (taxId) => set({ taxId }),
  setDescription: (description) => set({ description }),
  setEmail: (email) => set({ email }),
  setSource: (source) => set({ source }),
  setDeposit: (deposit) => set({ deposit }),
  setDiscountAmount: (discountAmount) => set({ discountAmount }),
  setIsTaxed: (isTaxed) => set({ isTaxed }),
  setSelectedItems: (selectedItems) => set({ selectedItems }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({
    step: 1,
    isProductPhase: false,
    customer: null,
    staffId: null,
    phone: '',
    phone2: '',
    address: '',
    city: '',
    cityId: 0,
    district: '',
    isNewInfo: false,
    date: dayjs().format('YYYY-MM-DD'),
    deliveryDate: dayjs().format('YYYY-MM-DD'),
    paymentAccount: null,
    taxId: '',
    description: '',
    email: '',
    source: '',
    deposit: 0,
    discountAmount: 0,
    isTaxed: true,
    selectedItems: [],
    loading: false,
  }),
}));
