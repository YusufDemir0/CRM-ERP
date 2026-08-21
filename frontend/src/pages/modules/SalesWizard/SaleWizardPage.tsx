import { useEffect } from 'react';
import { SaleWizard } from './SaleWizard';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { invalidateAfterSale } from '../../../services/queryUtils';
import { useSalesWizardStore } from '../../../store/useSalesWizardStore';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salesWizardSchema, SalesWizardFormData } from './schema';

export default function SaleWizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Read initial draft data once (non-reactive) to seed form defaults
  const initialDraft = useSalesWizardStore.getState().draftData;

  const methods = useForm<SalesWizardFormData>({
    resolver: zodResolver(salesWizardSchema),
    defaultValues: {
      customerId: String(initialDraft.customer?.id || ''),
      staffId: String(initialDraft.staffId || ''),
      paymentAccountId: initialDraft.paymentAccount?.id ? String(initialDraft.paymentAccount?.id) : '',
      phone: initialDraft.phone || '',
      phone2: initialDraft.phone2 || '',
      email: initialDraft.email || '',
      taxId: initialDraft.taxId || '',
      cityId: String(initialDraft.cityId || ''),
      district: initialDraft.district || '',
      address: initialDraft.address || '',
      date: initialDraft.date || new Date().toISOString().split('T')[0],
      deliveryDate: initialDraft.deliveryDate || '',
      deposit: (initialDraft.deposit && initialDraft.deposit !== '0') ? Number(initialDraft.deposit) : 0,
      discountAmount: Number(initialDraft.discountAmount) || 0,
      source: initialDraft.source || '',
      isTaxed: initialDraft.isTaxed ?? true,
      isInvoiced: initialDraft.isInvoiced,
      representativePrice: initialDraft.representativePrice || '',
      description: initialDraft.description || '',
      maturityDays: initialDraft.maturityDays || 0,
      paymentType: initialDraft.paymentType || 'NAKİT',
      installments: initialDraft.installments || 1,
      items: (initialDraft.selectedItems || []).map(i => ({
        id: String(i.id),
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate || 20
      }))
    },
    mode: 'onTouched'
  });

  // Real-time subscription to form changes to auto-persist in Zustand draft
  useEffect(() => {
    const subscription = methods.watch((values) => {
      const setDraftData = useSalesWizardStore.getState().setDraftData;
      setDraftData({
        phone: values.phone || '',
        address: values.address || '',
        cityId: values.cityId || '',
        district: values.district || '',
        deliveryDate: values.deliveryDate || '',
        deposit: values.deposit !== undefined ? String(values.deposit) : '0',
        representativePrice: values.representativePrice || '0',
        isInvoiced: values.isInvoiced,
        description: values.description || '',
      });
    });
    return () => subscription.unsubscribe();
  }, [methods]);

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
