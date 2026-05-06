import { SaleWizard } from './SaleWizard';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../services/queryKeys';
import { invalidateAfterSale } from '../../../services/queryUtils';
import { useEffect } from 'react';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salesWizardSchema, SalesWizardFormData } from './schema';

export default function SaleWizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  // Sadece fonksiyonu alıyoruz, state'e abone olmuyoruz ki her tuşta re-render olmasın
  const setDraftData = useSalesWizardStore(s => s.setDraftData);

  const methods = useForm<SalesWizardFormData>({
    resolver: zodResolver(salesWizardSchema),
    defaultValues: {
      customerId: String(useSalesWizardStore.getState().draftData.customer?.id || ''),
      staffId: String(useSalesWizardStore.getState().draftData.staffId || ''),
      paymentAccountId: useSalesWizardStore.getState().draftData.paymentAccount?.id ? String(useSalesWizardStore.getState().draftData.paymentAccount?.id) : null,
      phone: useSalesWizardStore.getState().draftData.phone || '',
      phone2: useSalesWizardStore.getState().draftData.phone2 || '',
      email: useSalesWizardStore.getState().draftData.email || '',
      taxId: useSalesWizardStore.getState().draftData.taxId || '',
      cityId: String(useSalesWizardStore.getState().draftData.cityId || ''),
      district: useSalesWizardStore.getState().draftData.district || '',
      address: useSalesWizardStore.getState().draftData.address || '',
      date: useSalesWizardStore.getState().draftData.date || new Date().toISOString().split('T')[0],
      deliveryDate: useSalesWizardStore.getState().draftData.deliveryDate || new Date().toISOString().split('T')[0],
      deposit: Number(useSalesWizardStore.getState().draftData.deposit) || 0,
      discountAmount: Number(useSalesWizardStore.getState().draftData.discountAmount) || 0,
      source: useSalesWizardStore.getState().draftData.source || '',
      isTaxed: useSalesWizardStore.getState().draftData.isTaxed ?? true,
      description: useSalesWizardStore.getState().draftData.description || '',
      items: (useSalesWizardStore.getState().draftData.selectedItems || []).map(i => ({
        id: String(i.id),
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate || 20
      }))
    },
    mode: 'onChange'
  });

  // Auto-save draft without causing re-renders
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const subscription = methods.watch((value) => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        const currentDraft = useSalesWizardStore.getState().draftData;
        setDraftData({
          ...currentDraft,
          phone: value.phone || '',
          phone2: value.phone2 || '',
          email: value.email || '',
          taxId: value.taxId || '',
          cityId: value.cityId || '',
          district: value.district || '',
          address: value.address || '',
          date: value.date || '',
          deliveryDate: value.deliveryDate || '',
          deposit: String(value.deposit || 0),
          discountAmount: String(value.discountAmount || 0),
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
  }, [methods, setDraftData]);

  return (
    <div className="animate-in max-w-[1600px] mx-auto h-[calc(100vh-var(--header-h)-5rem)]">
      <FormProvider {...methods}>
        <SaleWizard 
          onCompleted={() => {
            invalidateAfterSale(queryClient);
            navigate('/sales');
          }} 
        />
      </FormProvider>
    </div>
  );
}
