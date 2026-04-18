import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useSalesWizardStore } from './useSalesWizardStore';
import { CartItem, Item } from '../types';

describe('useSalesWizardStore', () => {
  beforeEach(() => {
    useSalesWizardStore.getState().resetWizard();
    // Clear session storage mock
    window.sessionStorage.clear();
  });

  it('should initialize with default values', () => {
    const state = useSalesWizardStore.getState();
    expect(state.step).toBe(1);
    expect(state.cart).toEqual([]);
    expect(state.genDiscountValue).toBe('0');
  });

  it('should update steps correctly', () => {
    const { setStep } = useSalesWizardStore.getState();
    setStep(2);
    expect(useSalesWizardStore.getState().step).toBe(2);
  });

  it('should add items to cart and prevent duplicates', () => {
    const { addToCart } = useSalesWizardStore.getState();
    const mockItem: Item = { id: 101, name: 'Test Item', code: 'T1', itemTypeId: 1, quantityTypeId: 1, kdv: 18 } as unknown as Item;
    const cartItem: CartItem = { item: mockItem, qty: 1, price: 100, discountValue: 0, discountType: 'amount', kdvRate: 18 };

    addToCart(cartItem);
    expect(useSalesWizardStore.getState().cart).toHaveLength(1);
    expect(useSalesWizardStore.getState().cart[0].item.id).toBe(101);

    // Try adding same item again
    addToCart(cartItem);
    expect(useSalesWizardStore.getState().cart).toHaveLength(1);
  });

  it('should update cart items', () => {
    const { addToCart, updateCartItem } = useSalesWizardStore.getState();
    const mockItem: Item = { id: 101, name: 'Test Item', code: 'T1' } as unknown as Item;
    const cartItem: CartItem = { item: mockItem, qty: 1, price: 100, discountValue: 0, discountType: 'amount', kdvRate: 18 };

    addToCart(cartItem);
    updateCartItem(101, 'qty', 5);
    
    expect(useSalesWizardStore.getState().cart[0].qty).toBe(5);
  });

  it('should remove items from cart', () => {
    const { addToCart, removeCartItem } = useSalesWizardStore.getState();
    const mockItem: Item = { id: 101, name: 'Test Item' } as unknown as Item;
    const cartItem: CartItem = { item: mockItem, qty: 1, price: 100, discountValue: 0, discountType: 'amount', kdvRate: 18 };

    addToCart(cartItem);
    removeCartItem(101);
    expect(useSalesWizardStore.getState().cart).toHaveLength(0);
  });

  it('should reset the wizard state', () => {
    const { setStep, setPartyId, resetWizard } = useSalesWizardStore.getState();
    setStep(3);
    setPartyId('123');
    
    resetWizard();
    
    const state = useSalesWizardStore.getState();
    expect(state.step).toBe(1);
    expect(state.partyId).toBe('');
  });

  it('should handle persistence with debounce', async () => {
    vi.useFakeTimers();
    const { setPartyId } = useSalesWizardStore.getState();
    
    setPartyId('party_999');
    
    // Should NOT be in storage yet (500ms debounce)
    expect(sessionStorage.getItem('sales-wizard-storage')).toBeNull();
    
    // Fast forward time
    vi.advanceTimersByTime(600);
    
    // Now it should be there
    const saved = sessionStorage.getItem('sales-wizard-storage');
    expect(saved).not.toBeNull();
    expect(JSON.parse(saved!).state.partyId).toBe('party_999');
    
    vi.useRealTimers();
  });
});
