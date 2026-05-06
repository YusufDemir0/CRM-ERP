import { useState, useEffect } from 'react';
import { partiesAPI, accountsAPI, salesAPI, itemsAPI, staffAPI, departmentsAPI } from '../services/api';
import { Party, Item, SaleType, Account, Staff, Department } from '../types';
import { useSalesWizardStore } from '../store/useSalesWizardStore';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/useAuthStore';
import { SalesWizardFormData } from '../pages/modules/SalesWizard/schema';

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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    try {
      const [cRes, aRes, iRes, stRes, sRes, dRes] = await Promise.all([
        partiesAPI.getAll({ limit: 100, type: 'customer' }),
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

      const allStaff = sRes.data.data;
      if (user?.departmentId) {
        setStaff(allStaff.filter(s => Number(s.departmentId) === Number(user.departmentId)));
      } else {
        setStaff(allStaff);
      }

      if (user?.departmentId) {
        const userDept = dRes.data.data.find(d => Number(d.id) === Number(user.departmentId));
        if (userDept) {
          setDepartment(userDept);
          // Auto-select payment account is handled at form initialization via draftData if null
        }
      }

    } catch (error) {
      toast.error("Veriler yüklenirken hata oluştu.");
    }
  };

  const refreshLookups = async () => {
    await loadLookups();
  };

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
    staff,
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
