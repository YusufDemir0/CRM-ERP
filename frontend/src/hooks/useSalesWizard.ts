import { useState, useEffect } from 'react';
import { partiesAPI, accountsAPI, salesAPI, itemsAPI, staffAPI, departmentsAPI } from '../services/api';
import { Party, Item, SaleType, Account, Staff, Department } from '../types';
import { useSalesWizardStore } from '../store/useSalesWizardStore';
import toast from 'react-hot-toast';

import { useAuthStore } from '../store/useAuthStore';

export const useSalesWizard = (onCompleted: () => void) => {
  const store = useSalesWizardStore();
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<Party[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [saleTypes, setSaleTypes] = useState<SaleType[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [searchCustomer, setSearchCustomer] = useState('');

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      const [cRes, aRes, iRes, stRes, sRes, dRes] = await Promise.all([
        partiesAPI.getAll({ limit: 100, type: 'customer,both' }),
        accountsAPI.getAll({ limit: 100 }),
        itemsAPI.getAll({ limit: 100 }),
        salesAPI.getTypes(),
        staffAPI.getAll({ limit: 200 }),
        departmentsAPI.getAll({ limit: 100 })
      ]);
      
      setCustomers(cRes.data.data);
      setAccounts(aRes.data.data);
      setItems(iRes.data.data);
      setSaleTypes(stRes.data);

      // Filter staff by department if user has one
      const allStaff = sRes.data.data;
      if (user?.departmentId) {
        setStaff(allStaff.filter(s => Number(s.departmentId) === Number(user.departmentId)));
      } else {
        setStaff(allStaff);
      }

      // Find default account for user's department
      if (user?.departmentId) {
        const userDept = dRes.data.data.find(d => Number(d.id) === Number(user.departmentId));
        if (userDept) {
          setDepartment(userDept);
          if (userDept.commercialAccountId) {
            const defaultAcc = aRes.data.data.find(a => Number(a.id) === Number(userDept.commercialAccountId));
            if (defaultAcc && !store.paymentAccount) {
              store.setPaymentAccount(defaultAcc);
            }
          }
        }
      }

    } catch (error) {
      toast.error("Veriler yüklenirken hata oluştu.");
    }
  };

  const refreshLookups = async () => {
    await loadLookups();
  };

  const handleSelectCustomer = (c: Party) => {
    store.setCustomer(c);
  };

  const handleSubmit = async () => {
    if (store.selectedItems.length === 0) return toast.error("Lütfen en az bir ürün ekleyin.");
    
    store.setLoading(true);
    try {
      if (!store.customer) throw new Error("Müşteri seçilmedi.");
      const payload = {
        partyId: Number(store.customer.id),
        staffId: store.staffId ? Number(store.staffId) : null,
        phone: store.phone,
        address: store.address,
        city: store.city,
        district: store.district,
        deliveryDate: store.deliveryDate,
        currencyId: Number(store.customer.currencyId || 1),
        deposit: String(store.deposit || 0),
        discountAmount: String(store.discountAmount || 0),
        commercialAccountId: store.paymentAccount?.id ? Number(store.paymentAccount.id) : null,
        taxNumber: store.taxId,
        notes: store.description,
        email: store.email,
        source: store.source,
        saleTypeId: Number(saleTypes[0]?.id || 1),
        items: store.selectedItems.map(item => ({
          itemId: Number(item.id),
          quantity: String(item.quantity),
          price: String(item.unitPrice),
          kdvRate: String(store.isTaxed ? (item.taxRate || 20) : 0)
        }))
      };
      
      await salesAPI.create(payload);
      toast.success("Satış başarıyla oluşturuldu.");
      store.reset();
      onCompleted();
    } catch (error) {
      toast.error("Satış kaydedilirken hata oluştu.");
    } finally {
      store.setLoading(false);
    }
  };

  return {
    customers,
    accounts,
    staff,
    items,
    saleTypes,
    department,
    searchCustomer,
    setSearchCustomer,
    handleSelectCustomer,
    handleSubmit,
    refreshLookups,
    loading: store.loading
  };
};
