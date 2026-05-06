import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { partiesAPI, accountsAPI, salesAPI, itemsAPI, staffAPI, departmentsAPI } from '../services/api';
import { Party, Item, SaleType, Account, Staff, Department } from '../types';
import { useSalesWizardStore } from '../store/useSalesWizardStore';
import { queryKeys } from '../services/queryKeys';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { SalesWizardFormData } from '../pages/modules/SalesWizard/schema';

export const useSalesWizard = (onCompleted: () => void) => {
  const store = useSalesWizardStore();
  const { user } = useAuthStore();
  const { data: customers = [] } = useQuery({
    queryKey: queryKeys.parties.lookup,
    queryFn: () => partiesAPI.lookup('customer').then(r => r.data)
  });

  const { data: accounts = [] } = useQuery({
    queryKey: queryKeys.accounts.lookup,
    queryFn: () => accountsAPI.getAll({ limit: 100 }).then(r => r.data.data)
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff', 'lookup'],
    queryFn: () => staffAPI.getAll({ limit: 200 }).then(r => r.data.data)
  });

  const { data: items = [] } = useQuery({
    queryKey: queryKeys.items.lookup,
    queryFn: () => itemsAPI.getAll({ limit: 100 }).then(r => r.data.data)
  });

  const { data: saleTypes = [] } = useQuery({
    queryKey: ['saleTypes'],
    queryFn: () => salesAPI.getTypes().then(r => r.data)
  });

  const { data: departments = [] } = useQuery({
    queryKey: queryKeys.departments.lookup,
    queryFn: () => departmentsAPI.getAll({ limit: 100 }).then(r => r.data.data)
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

  const refreshLookups = () => {};
  const searchCustomer = '';
  const setSearchCustomer = () => {};

  const submitForm = async (data: SalesWizardFormData) => {
    setLoading(true);
    try {
      const customer = customers.find(c => String(c.id) === String(data.customerId));
      const currencyId = customer?.currencyId || 1;

      const payload = {
        partyId: data.customerId ? String(data.customerId) : "",
        staffId: data.staffId ? String(data.staffId) : undefined,
        phone: data.phone,
        address: `${data.address || ''} ${data.district || ''}`.trim(),
        deliveryDate: data.deliveryDate,
        currencyId: currencyId ? String(currencyId) : "1",
        deposit: String(data.deposit || 0),
        discountAmount: String(data.discountAmount || 0),
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
          kdvRate: String(data.isTaxed ? (item.taxRate || 20) : 0)
        }))
      };
      
      await salesAPI.create(payload);
      toast.success("Satış başarıyla oluşturuldu.");
      store.reset();
      onCompleted();
    } catch (error) {
      toast.error("Satış kaydedilirken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return {
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
  };
};
