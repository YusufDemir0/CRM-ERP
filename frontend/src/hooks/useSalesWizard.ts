import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { partiesAPI, accountsAPI, salesAPI, itemsAPI, staffAPI, departmentsAPI } from '../services/api';
import { Party, Item, SaleType, Account, Staff, Department, Sale, CreateSaleDto } from '../types';
import { useSalesWizardStore } from '../store/useSalesWizardStore';
import { queryKeys } from '../services/queryKeys';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { SalesWizardFormData } from '../pages/modules/SalesWizard/schema';
import Decimal from 'decimal.js';
import { useCallback } from 'react';
import { invalidateAfterSale } from '../services/queryUtils';

export const useSalesWizard = (onCompleted: () => void) => {
  const store = useSalesWizardStore();
  const userDepartmentId = useAuthStore(s => s.user?.departmentId);
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
    queryFn: () => accountsAPI.getAll({ limit: 200, ignorePermissionRestrictions: 'true' }).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff', 'lookup'],
    queryFn: () => staffAPI.getAll({ limit: 200 }).then(r => r.data.data),
    staleTime: 10 * 60 * 1000,
  });

  const { data: items = [] } = useQuery({
    queryKey: queryKeys.items.lookup,
    queryFn: () => itemsAPI.getAll({ limit: 5000, state: 1 }).then(r => r.data.data),
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
    if (userDepartmentId) {
      return staff.filter(s => Number(s.departmentId) === Number(userDepartmentId));
    }
    return staff;
  }, [staff, userDepartmentId]);

  const department = useMemo(() => {
    if (userDepartmentId) {
      return departments.find(d => Number(d.id) === Number(userDepartmentId)) || null;
    }
    return null;
  }, [departments, userDepartmentId]);

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
        address: data.address || '',
        city: data.cityId || '',
        district: data.district || '',
        deliveryDate: data.deliveryDate,
        currencyId: String(currencyId),
        deposit: String(data.deposit || 0),
        discountAmount: '0',
        representativePrice: String(data.representativePrice || 0),
        commercialAccountId: data.paymentAccountId ? String(data.paymentAccountId) : undefined,
        taxNumber: data.taxId,
        notes: data.description,
        email: data.email,
        source: data.source,
        saleTypeId: (() => {
          const typeAbbr = data.isInvoiced ? 'TPT' : 'PRK';
          const saleTypeObj = saleTypes.find((t: any) => t.abbreviation === typeAbbr);
          return saleTypeObj?.id ? String(saleTypeObj.id) : (data.isInvoiced ? "1" : "2");
        })(),
        maturityDays: data.maturityDays || 0,
        paymentType: data.paymentType || 'NAKİT',
        installments: data.installments || 1,
        items: data.items.map(item => ({
          itemId: String(item.id),
          quantity: String(item.quantity),
          price: String(item.unitPrice),
          kdvRate: String(item.taxRate || 20)
        }))
      };
      
      if (store.draftData.id) {
        await salesAPI.update(store.draftData.id, payload as unknown as Partial<Sale>);
        toast.success("Satış başarıyla güncellendi.");
      } else {
        await salesAPI.create(payload as unknown as CreateSaleDto);
        toast.success("Satış başarıyla oluşturuldu.");
      }
      invalidateAfterSale(queryClient);
      queryClient.refetchQueries({ queryKey: ['parties'] });
      store.reset();
      onCompleted();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "Satış kaydedilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  }, [customers, saleTypes, onCompleted, store, queryClient]);

  return useMemo(() => ({
    customers,
    accounts,
    staff: staff,
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
