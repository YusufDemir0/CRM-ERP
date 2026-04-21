import React from 'react';
import { Party, Item, SaleType, Account } from '../../../types';

export interface WizardStep {
  id: number;
  title: string;
  icon: React.ReactNode;
  field: string;
}

export interface SelectedItem extends Item {
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export interface WizardState {
  step: number;
  isProductPhase: boolean;
  customer: Party | null;
  phone: string;
  address: string;
  date: string;
  paymentAccount: Account | null;
  taxId: string;
  description: string;
  email: string;
  source: string;
  selectedItems: SelectedItem[];
  loading: boolean;
  customers: Party[];
  accounts: Account[];
  items: Item[];
  saleTypes: SaleType[];
  searchCustomer: string;
  searchItem: string;
}
