import { describe, it, expect, beforeEach } from 'vitest';
import { useSalesWizardStore } from './useSalesWizardStore';
import { Party } from '../types';
import { Decimal } from 'decimal.js';

describe('useSalesWizardStore', () => {
  beforeEach(() => {
    useSalesWizardStore.getState().reset();
  });

  it('should initialize with default values', () => {
    const state = useSalesWizardStore.getState();
    expect(state.draftData.step).toBe(1);
    expect(new Decimal(state.draftData.discountAmount).isZero()).toBe(true);
    expect(state.draftData.customer).toBeNull();
  });

  it('should set customer correctly via startQuickSale', () => {
    const { startQuickSale } = useSalesWizardStore.getState();
    const mockCustomer = { id: '1', name: 'Test Müşteri', phone1: '5551234455' } as Party;
    
    startQuickSale(mockCustomer);
    
    const state = useSalesWizardStore.getState();
    expect(state.draftData.customer?.id).toBe('1');
    expect(state.draftData.phone).toBe('5551234455');
  });

  it('should update discount amount', () => {
    const { setDraftData, draftData } = useSalesWizardStore.getState();
    setDraftData({ ...draftData, discountAmount: '150' });
    expect(new Decimal(useSalesWizardStore.getState().draftData.discountAmount).equals('150')).toBe(true);
  });

  it('should reset the wizard state', () => {
    const { startQuickSale, reset } = useSalesWizardStore.getState();
    startQuickSale({ id: '99', name: 'Silinecek' } as Party);
    
    reset();
    
    const state = useSalesWizardStore.getState();
    expect(state.draftData.customer).toBeNull();
    expect(state.draftData.selectedItems).toHaveLength(0);
    expect(state.draftData.step).toBe(1);
  });

  it('should auto-compute phase when step changes', () => {
    const { setStep } = useSalesWizardStore.getState();

    setStep(1);
    expect(useSalesWizardStore.getState().draftData.phase).toBe('customer');

    setStep(2);
    expect(useSalesWizardStore.getState().draftData.phase).toBe('customer');

    setStep(3);
    expect(useSalesWizardStore.getState().draftData.phase).toBe('logistics');

    setStep(7);
    expect(useSalesWizardStore.getState().draftData.phase).toBe('logistics');

    setStep(8);
    expect(useSalesWizardStore.getState().draftData.phase).toBe('products');

    setStep(11);
    expect(useSalesWizardStore.getState().draftData.phase).toBe('preview');
  });
});
