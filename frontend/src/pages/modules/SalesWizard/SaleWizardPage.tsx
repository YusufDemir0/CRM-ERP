import { SaleWizard } from './SaleWizard';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import { useEffect } from 'react';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salesWizardSchema, SalesWizardFormData } from './schema';

export default function SaleWizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { draftData, setDraftData } = useSalesWizardStore();

  const methods = useForm<SalesWizardFormData>({
    resolver: zodResolver(salesWizardSchema) as any,
    defaultValues: {
      customerId: draftData.customer?.id || '',
      staffId: draftData.staffId || '',
      paymentAccountId: draftData.paymentAccount?.id || null,
      phone: draftData.phone || '',
      phone2: draftData.phone2 || '',
      email: draftData.email || '',
      taxId: draftData.taxId || '',
      cityId: draftData.cityId || '',
      district: draftData.district || '',
      address: draftData.address || '',
      date: draftData.date || new Date().toISOString().split('T')[0],
      deliveryDate: draftData.deliveryDate || new Date().toISOString().split('T')[0],
      deposit: draftData.deposit || 0,
      discountAmount: draftData.discountAmount || 0,
      source: draftData.source || '',
      isTaxed: draftData.isTaxed ?? true,
      description: draftData.description || '',
      items: (draftData.selectedItems || []).map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate || 20
      }))
    },
    mode: 'onChange'
  });

  // Auto-save draft on every change (Fixed Debounce)
  useEffect(() => {
    let timeoutId: any;
    const subscription = methods.watch((value) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setDraftData({
          ...draftData,
          phone: value.phone || '',
          phone2: value.phone2 || '',
          email: value.email || '',
          taxId: value.taxId || '',
          cityId: value.cityId || '',
          district: value.district || '',
          address: value.address || '',
          date: value.date || '',
          deliveryDate: value.deliveryDate || '',
          deposit: Number(value.deposit) || 0,
          discountAmount: Number(value.discountAmount) || 0,
          source: value.source || '',
          isTaxed: !!value.isTaxed,
          description: value.description || '',
          staffId: value.staffId || '',
          selectedItems: (value.items as any[]) || []
        });
      }, 1000);
    });
    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [methods, setDraftData, draftData]);

  return (
    <div className="animate-in max-w-[1600px] mx-auto h-[calc(100vh-var(--header-h)-5rem)]">
      <FormProvider {...methods}>
        <SaleWizard 
          onCompleted={() => {
            queryClient.invalidateQueries({ queryKey: queryKeys.sales.all({}) });
            navigate('/sales');
          }} 
        />
      </FormProvider>
    </div>
  );
}
