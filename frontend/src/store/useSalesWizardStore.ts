import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, SalesWizardState } from '../types';

interface SalesWizardActions {
  setStep: (step: number) => void;
  setPartyId: (id: string) => void;
  setCustomerSearch: (search: string) => void;
  setIsCustomerDropdownOpen: (open: boolean) => void;
  setSaleTypeId: (id: string) => void;
  setCurrencyId: (id: string) => void;
  setDeliveryDate: (date: string) => void;
  setRepId: (id: string) => void;
  setInvoiceType: (type: 'billed' | 'unbilled' | null) => void;
  setCart: (cart: CartItem[]) => void;
  addToCart: (item: CartItem) => void;
  updateCartItem: (itemId: number, field: keyof CartItem, value: any) => void;
  removeCartItem: (itemId: number) => void;
  setSearchTerm: (term: string) => void;
  setGenDiscountType: (type: 'amount' | 'percent') => void;
  setGenDiscountValue: (value: string) => void;
  setDeposit: (deposit: string) => void;
  setSaleNotes: (notes: string) => void;
  resetWizard: () => void;
}

export const useSalesWizardStore = create<SalesWizardState & SalesWizardActions>()(
  persist(
    (set) => ({
      // initial state
      step: 1,
      partyId: '',
      customerSearch: '',
      isCustomerDropdownOpen: false,
      saleTypeId: '',
      currencyId: '',
      deliveryDate: new Date().toISOString().split('T')[0],
      repId: '',
      invoiceType: null,
      cart: [],
      searchTerm: '',
      genDiscountType: 'amount',
      genDiscountValue: '0',
      deposit: '0',
      saleNotes: '',

      // actions
      setStep: (step) => set({ step }),
      setPartyId: (partyId) => set({ partyId }),
      setCustomerSearch: (customerSearch) => set({ customerSearch }),
      setIsCustomerDropdownOpen: (isCustomerDropdownOpen) => set({ isCustomerDropdownOpen }),
      setSaleTypeId: (saleTypeId) => set({ saleTypeId }),
      setCurrencyId: (currencyId) => set({ currencyId }),
      setDeliveryDate: (deliveryDate) => set({ deliveryDate }),
      setRepId: (repId) => set({ repId }),
      setInvoiceType: (invoiceType) => set({ invoiceType }),
      setCart: (cart) => set({ cart }),
      addToCart: (item) => set((state) => {
        if (state.cart.some(c => c.item.id === item.item.id)) return state;
        return { cart: [...state.cart, item] };
      }),
      updateCartItem: (itemId, field, value) => set((state) => ({
        cart: state.cart.map(c => c.item.id === itemId ? { ...c, [field]: value } : c)
      })),
      removeCartItem: (itemId) => set((state) => ({
        cart: state.cart.filter(c => c.item.id !== itemId)
      })),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setGenDiscountType: (genDiscountType) => set({ genDiscountType }),
      setGenDiscountValue: (genDiscountValue) => set({ genDiscountValue }),
      setDeposit: (deposit) => set({ deposit }),
      setSaleNotes: (saleNotes) => set({ saleNotes }),
      resetWizard: () => set({
        step: 1,
        partyId: '',
        customerSearch: '',
        isCustomerDropdownOpen: false,
        saleTypeId: '',
        currencyId: '',
        deliveryDate: new Date().toISOString().split('T')[0],
        repId: '',
        invoiceType: null,
        cart: [],
        searchTerm: '',
        genDiscountType: 'amount',
        genDiscountValue: '0',
        deposit: '0',
        saleNotes: '',
      }),
    }),
    {
      name: 'sales-wizard-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
