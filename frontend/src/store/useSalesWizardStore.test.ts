import { describe, it, expect, beforeEach } from 'vitest';
import { useSalesWizardStore } from './useSalesWizardStore';
import { Party } from '../types';

describe('useSalesWizardStore', () => {
  beforeEach(() => {
    useSalesWizardStore.getState().reset();
  });

  it('should initialize with default values', () => {
    const state = useSalesWizardStore.getState();
    expect(state.step).toBe(1);
    expect(state.selectedItems).toEqual([]);
    expect(state.discountAmount).toBe(0);
    expect(state.customer).toBeNull();
  });

  it('should update steps correctly', () => {
    const { setStep } = useSalesWizardStore.getState();
    setStep(2);
    expect(useSalesWizardStore.getState().step).toBe(2);
  });

  it('should set customer correctly', () => {
    const { setCustomer } = useSalesWizardStore.getState();
    const mockCustomer = { id: 1, name: 'Test Müşteri', phone1: '5551234455' } as Party;
    
    setCustomer(mockCustomer);
    
    const state = useSalesWizardStore.getState();
    expect(state.customer?.id).toBe(1);
    expect(state.phone).toBe('5551234455');
  });

  it('should update discount amount', () => {
    const { setDiscountAmount } = useSalesWizardStore.getState();
    setDiscountAmount(150);
    expect(useSalesWizardStore.getState().discountAmount).toBe(150);
  });

  it('should reset the wizard state', () => {
    const { setStep, setCustomer, reset } = useSalesWizardStore.getState();
    setStep(3);
    setCustomer({ id: 99, name: 'Silinecek' } as Party);
    
    reset();
    
    const state = useSalesWizardStore.getState();
    expect(state.step).toBe(1);
    expect(state.customer).toBeNull();
    expect(state.selectedItems).toHaveLength(0);
  });
});
