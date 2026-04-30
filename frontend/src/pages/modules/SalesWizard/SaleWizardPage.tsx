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
    resolver: zodResolver(salesWizardSchema) as unknown as import('react-hook-form').Resolver<SalesWizardFormData>,
    defaultValues: {
      customerId: draftData.customer?.id || 0,
      staffId: draftData.staffId || 0,
      paymentAccountId: draftData.paymentAccount?.id || null,
      phone: draftData.phone,
      phone2: draftData.phone2,
      email: draftData.email,
      taxId: draftData.taxId,
      cityId: draftData.cityId,
      district: draftData.district,
      address: draftData.address,
      date: draftData.date,
      deliveryDate: draftData.deliveryDate,
      deposit: draftData.deposit,
      discountAmount: draftData.discountAmount,
      source: draftData.source,
      isTaxed: draftData.isTaxed,
      description: draftData.description,
      items: draftData.selectedItems.map(i => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        taxRate: i.taxRate || 20
      }))
    },
    mode: 'onChange' // Validate as user types
  });

  // Auto-save draft on every change
  useEffect(() => {
    const subscription = methods.watch((value) => {
      // It's technically Partial<SalesWizardFormData> but draftData accepts it
      setDraftData(value as Parameters<typeof setDraftData>[0]);
    });
    return () => subscription.unsubscribe();
  }, [methods, setDraftData]);

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
