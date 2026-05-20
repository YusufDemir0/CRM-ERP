import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { partiesAPI, accountsAPI, salesAPI, itemsAPI, staffAPI, departmentsAPI } from '../services/api';
import { Party, Item, SaleType, Account, Staff, Department } from '../types';
import { useSalesWizardStore } from '../store/useSalesWizardStore';
import { queryKeys } from '../services/queryKeys';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { SalesWizardFormData } from '../pages/modules/SalesWizard/schema';
import Decimal from 'decimal.js';
import { useCallback } from 'react';

export const useSalesWizard = (onCompleted: () => void) => {
  const store = useSalesWizardStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  // FETCH ALL PARTIES (Customers + Suppliers)
  const { data: customers = [] } = useQuery({
    queryKey: queryKeys.parties.lookup,
    queryFn: () => partiesAPI.lookup().then(r => r.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000,
  });

  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.accounts.lookup,
    queryFn: () => accountsAPI.getAll({ limit: 200 }).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff', 'lookup'],
    queryFn: () => staffAPI.getAll({ limit: 200 }).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: items = [] } = useQuery({
    queryKey: queryKeys.items.lookup,
    queryFn: () => itemsAPI.getAll({ limit: 500 }).then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });

  const { data: saleTypes = [] } = useQuery({
    queryKey: ['saleTypes'],
    queryFn: () => salesAPI.getTypes().then(r => r.data),
    staleTime: 24 * 60 * 60 * 1000, // Very static
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.lookup,
    queryFn: () => departmentsAPI.getAll({ limit: 100 }).then(r => r.data.data),
    staleTime: 60 * 60 * 1000,
  });

  const [loading, setLoading] = useState(false);

  const filteredStaff = useMemo(() => {
    if (user?.departmentId) {
      return staff.filter(s => Number(s.departmentId) === Number(user.departmentId));
    }
    return staff;
  }, [staff, user?.departmentId]);

  const department = useMemo(() => {
    if (user?.departmentId) {
      return departments.find(d => Number(d.id) === Number(user.departmentId)) || null;
    }
    return null;
  }, [departments, user?.departmentId]);

  const refreshLookups = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.parties.lookup });
  }, [queryClient]);

  const searchCustomer = '';
  const setSearchCustomer = () => {};

  const submitForm = useCallback(async (data: SalesWizardFormData) => {
    setLoading(true);
    try {
      const customer = customers.find(c => String(c.id) === String(data.customerId));
      const currencyId = customer?.currencyId || "1";

      // Calculate discount from representative price
      const totalItemsPrice = data.items.reduce((acc, i) => acc.add(new Decimal(i.unitPrice || 0).mul(i.quantity || 0)), new Decimal(0));
      const repPrice = new Decimal(data.representativePrice || 0);
      const calculatedDiscount = totalItemsPrice.gt(repPrice) ? totalItemsPrice.minus(repPrice) : new Decimal(0);

      const payload = {
        partyId: data.customerId ? String(data.customerId) : "",
        staffId: data.staffId ? String(data.staffId) : undefined,
        phone: data.phone,
        address: `${data.address || ''} ${data.district || ''}`.trim(),
        deliveryDate: data.deliveryDate,
        currencyId: String(currencyId),
        deposit: String(data.deposit || 0),
        discountAmount: calculatedDiscount.toString(),
        commercialAccountId: data.paymentAccountId ? String(data.paymentAccountId) : undefined,
        taxNumber: data.taxId,
        notes: data.description,
        email: data.email,
        source: data.source,
        saleTypeId: saleTypes[0]?.id ? String(saleTypes[0].id) : "1",
        items: data.items.map(item => ({
          itemId: String(item.id),
          quantity: String(item.quantity),
          price: String(item.unitPrice),
          kdvRate: String(data.isInvoiced ? (item.taxRate || 20) : 0)
        }))
      };
      
      await salesAPI.create(payload);
      toast.success("Satış başarıyla oluşturuldu.");
      store.reset();
      onCompleted();
    } catch (error: any) {
      console.error('Sale Creation Error:', error.response?.data || error);
      toast.error(error.response?.data?.message || "Satış kaydedilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [customers, saleTypes, onCompleted, store]);

  return useMemo(() => ({
    customers,
    accounts,
    staff: filteredStaff,
    items,
    saleTypes,
    department,
    searchCustomer,
    setSearchCustomer,
    submitForm,
    refreshLookups,
    loading
  }), [customers, accounts, filteredStaff, items, saleTypes, department, submitForm, refreshLookups, loading]);
};
